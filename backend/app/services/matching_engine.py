import re
import unicodedata
from difflib import SequenceMatcher
from typing import Optional, List, Tuple
from app.services.metadata.base import ProviderAnimeCandidate


def normalize_text(text: str) -> str:
    """Normalize text for consistent title comparison: Unicode NFKD, lowercase, strip punctuation."""
    if not text:
        return ""
    # Unicode decomposition (e.g., accented characters, full-width kana/romaji)
    nfkd = unicodedata.normalize("NFKD", text)
    # Remove non-alphanumeric characters except spaces
    cleaned = re.sub(r"[^\w\s]", " ", nfkd.lower())
    # Collapse multiple whitespaces
    return " ".join(cleaned.split())


def extract_season_number(title: str) -> Optional[int]:
    """Extract season number from title strings like 'Season 2', '2nd Season', 'S2', 'Part 2'."""
    lower = title.lower()
    
    # Check 'season X' or 'sX'
    m = re.search(r"\bseason\s*(\d+)\b", lower)
    if m:
        return int(m.group(1))
    
    m = re.search(r"\b(\d+)(?:st|nd|rd|th)\s+season\b", lower)
    if m:
        return int(m.group(1))
    
    m = re.search(r"\bpart\s*(\d+)\b", lower)
    if m:
        return int(m.group(1))
    
    m = re.search(r"\bs(\d+)\b", lower)
    if m:
        return int(m.group(1))
        
    return None


def is_movie(title: str) -> bool:
    """Check if title explicitly refers to a movie adaptation."""
    lower = title.lower()
    return bool(re.search(r"\b(movie|gekijouban|the movie)\b", lower))


def is_ova(title: str) -> bool:
    """Check if title explicitly refers to an OVA or Special."""
    lower = title.lower()
    return bool(re.search(r"\b(ova|oad|special)\b", lower))


class TitleMatchingEngine:
    """Multi-stage title matching and disambiguation engine."""

    HIGH_CONFIDENCE_THRESHOLD = 0.82
    AMBIGUOUS_THRESHOLD = 0.60

    @classmethod
    def calculate_similarity(cls, input_title: str, candidate_title: str) -> float:
        """Calculate normalized string similarity ratio between 0.0 and 1.0."""
        norm_in = normalize_text(input_title)
        norm_cand = normalize_text(candidate_title)

        if not norm_in or not norm_cand:
            return 0.0

        if norm_in == norm_cand:
            return 1.0

        # Exact token match ignoring word order
        tokens_in = set(norm_in.split())
        tokens_cand = set(norm_cand.split())
        if tokens_in == tokens_cand:
            return 0.98

        # Sequence matcher ratio
        base_ratio = SequenceMatcher(None, norm_in, norm_cand).ratio()

        # Token set overlap bonus if all query words appear in candidate
        if tokens_in.issubset(tokens_cand):
            overlap_score = len(norm_in) / max(len(norm_cand), 1)
            base_ratio = max(base_ratio, 0.70 + (overlap_score * 0.25))

        return round(min(1.0, max(0.0, base_ratio)), 4)

    @classmethod
    def score_candidate(cls, input_title: str, candidate: ProviderAnimeCandidate) -> Tuple[float, Optional[str]]:
        """
        Score candidate against input title considering canonical, english, romaji, and alternate titles,
        applying penalties for season/format mismatches.
        """
        best_score = 0.0
        warning = None

        # Compare input title across all titles of candidate
        all_candidate_titles = candidate.all_titles or [candidate.title]
        if candidate.canonical_title and candidate.canonical_title not in all_candidate_titles:
            all_candidate_titles.append(candidate.canonical_title)
        if candidate.english_title and candidate.english_title not in all_candidate_titles:
            all_candidate_titles.append(candidate.english_title)

        for cand_title in all_candidate_titles:
            sim = cls.calculate_similarity(input_title, cand_title)
            if sim > best_score:
                best_score = sim

        # 1. Season mismatch check
        in_season = extract_season_number(input_title)
        cand_season = extract_season_number(candidate.title)
        if cand_season is None and candidate.canonical_title:
            cand_season = extract_season_number(candidate.canonical_title)

        if in_season is not None and cand_season is not None:
            if in_season != cand_season:
                best_score = max(0.0, best_score - 0.35)
                warning = f"Season mismatch (input: S{in_season}, candidate: S{cand_season})"
        elif in_season is not None and in_season > 1 and cand_season is None:
            # User specified Season > 1, but candidate appears to be Season 1/base series
            best_score = max(0.0, best_score - 0.25)
            warning = f"Input specifies Season {in_season}, but candidate has no season indicator"

        # 2. Movie vs TV mismatch check
        in_is_movie = is_movie(input_title)
        cand_is_movie = is_movie(candidate.title) or (candidate.media_type and candidate.media_type.lower() == "movie")
        if in_is_movie != cand_is_movie and (in_is_movie or cand_is_movie):
            best_score = max(0.0, best_score - 0.20)
            warning = "Format mismatch between movie and television series"

        return round(best_score, 4), warning

    @classmethod
    def evaluate_candidates(
        cls,
        input_title: str,
        candidates: List[ProviderAnimeCandidate]
    ) -> Tuple[Optional[ProviderAnimeCandidate], str, float, Optional[str]]:
        """
        Evaluate candidate list and return (best_candidate, status, confidence, warning).
        Status is one of: 'MATCHED', 'AMBIGUOUS', 'UNMATCHED'.
        """
        if not candidates:
            return None, "UNMATCHED", 0.0, "No results found from metadata provider"

        scored_candidates = []
        for c in candidates:
            score, warn = cls.score_candidate(input_title, c)
            scored_candidates.append((score, warn, c))

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_score, top_warning, top_candidate = scored_candidates[0]

        # Check for ambiguity: multiple candidates with close scores
        if len(scored_candidates) > 1:
            second_score, _, _ = scored_candidates[1]
            if top_score >= cls.AMBIGUOUS_THRESHOLD and (top_score - second_score) < 0.12:
                return top_candidate, "AMBIGUOUS", top_score, "Multiple close franchise matches found"

        if top_score >= cls.HIGH_CONFIDENCE_THRESHOLD and not top_warning:
            return top_candidate, "MATCHED", top_score, None
        elif top_score >= cls.AMBIGUOUS_THRESHOLD:
            return top_candidate, "AMBIGUOUS", top_score, top_warning or "Requires user confirmation"
        else:
            return top_candidate, "UNMATCHED", top_score, top_warning or "Low similarity score"
