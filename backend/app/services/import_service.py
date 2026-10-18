import csv
import io
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Tuple, Any

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.anime import AnimeEntry, normalize_title
from app.models.import_job import ImportJob, ImportJobItem
from app.schemas.anime import AnimeStatus, validate_safe_poster_url
from app.schemas.import_schemas import (
    ParsedImportRow,
    ParseImportResponse,
    CreateImportJobRequest,
    ImportItemUpdate,
)
from app.services.matching_engine import TitleMatchingEngine
from app.services.metadata.factory import get_metadata_provider
from app.services.metadata.base import ProviderAnimeCandidate


STATUS_MAP = {
    "watching": AnimeStatus.WATCHING,
    "currently watching": AnimeStatus.WATCHING,
    "current": AnimeStatus.WATCHING,
    "in-progress": AnimeStatus.WATCHING,
    "completed": AnimeStatus.COMPLETED,
    "finished": AnimeStatus.COMPLETED,
    "done": AnimeStatus.COMPLETED,
    "paused": AnimeStatus.PAUSED,
    "on-hold": AnimeStatus.PAUSED,
    "on hold": AnimeStatus.PAUSED,
    "hold": AnimeStatus.PAUSED,
    "dropped": AnimeStatus.DROPPED,
    "plan to watch": AnimeStatus.PLANNED,
    "plantowatch": AnimeStatus.PLANNED,
    "planned": AnimeStatus.PLANNED,
    "planning": AnimeStatus.PLANNED,
    "ptw": AnimeStatus.PLANNED,
    "watchlist": AnimeStatus.PLANNED,
}


def clean_title_string(raw: str) -> str:
    """Strip list markers, bullets, leading numbers, and extra quotes."""
    s = raw.strip()
    # Remove leading numbering like "1. ", "12) ", "- ", "* ", "• "
    s = re.sub(r"^(\d+[\.\)\-:]|\*|\-|•)\s*", "", s)
    # Strip enclosing quotes
    s = s.strip("\"' \t\r\n")
    return s


def parse_status_string(raw_status: Optional[str]) -> AnimeStatus:
    if not raw_status:
        return AnimeStatus.PLANNED
    cleaned = raw_status.strip().lower().replace("_", " ")
    return STATUS_MAP.get(cleaned, AnimeStatus.PLANNED)


def parse_rating_val(raw_rating: Any) -> Optional[int]:
    if raw_rating is None:
        return None
    try:
        val = float(str(raw_rating).strip())
        if val <= 0:
            return None
        # Convert 100-point scale (e.g. AniList 85 -> 9 or 8.5)
        if val > 10 and val <= 100:
            val = round(val / 10.0)
        score = int(round(val))
        return max(1, min(10, score))
    except (ValueError, TypeError):
        return None


def parse_integer_val(raw_int: Any) -> int:
    if raw_int is None:
        return 0
    try:
        val = int(str(raw_int).strip())
        return max(0, val)
    except (ValueError, TypeError):
        return 0


def parse_raw_text(text: str) -> List[ParsedImportRow]:
    """Parse plain text input (one title per line)."""
    rows: List[ParsedImportRow] = []
    seen_titles = set()

    for line in text.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#") or trimmed.startswith("//"):
            continue

        clean_title = clean_title_string(trimmed)
        if not clean_title or len(clean_title) < 1:
            continue

        norm = normalize_title(clean_title)
        if norm in seen_titles:
            continue
        seen_titles.add(norm)

        rows.append(ParsedImportRow(
            raw_title=clean_title[:255],
            status=AnimeStatus.PLANNED,
            watched_episodes=0,
            rating=None,
            notes=None,
        ))

        if len(rows) >= 500:
            break

    return rows


def parse_raw_csv(csv_content: str) -> Tuple[List[ParsedImportRow], List[str]]:
    """Parse CSV text with smart header detection and fallback."""
    rows: List[ParsedImportRow] = []
    errors: List[str] = []
    seen_titles = set()

    # Determine delimiter
    sample = csv_content[:2048]
    delimiter = ","
    if "\t" in sample and sample.count("\t") > sample.count(","):
        delimiter = "\t"
    elif ";" in sample and sample.count(";") > sample.count(","):
        delimiter = ";"

    reader = csv.reader(io.StringIO(csv_content), delimiter=delimiter)
    all_lines = [row for row in reader if row and any(cell.strip() for cell in row)]
    if not all_lines:
        return rows, ["CSV content is empty."]

    # Inspect first line for headers
    header_line = [col.strip().lower() for col in all_lines[0]]
    
    title_idx = -1
    status_idx = -1
    watched_idx = -1
    total_idx = -1
    rating_idx = -1
    notes_idx = -1

    title_keywords = ["title", "series_title", "anime_title", "name", "anime", "series"]
    status_keywords = ["status", "series_status", "my_status", "user_status", "state"]
    watched_keywords = ["watched_episodes", "watched", "episodes_watched", "progress", "my_watched_episodes", "eps_watched"]
    total_keywords = ["total_episodes", "series_episodes", "episodes", "eps_total", "total"]
    rating_keywords = ["rating", "score", "my_score", "user_rating", "user_score"]
    notes_keywords = ["notes", "comment", "comments", "my_comments", "review", "user_notes"]

    for idx, col in enumerate(header_line):
        col_clean = re.sub(r"[_\s\-]+", "", col)
        if title_idx == -1 and any(k.replace("_", "") in col_clean for k in title_keywords):
            title_idx = idx
        elif status_idx == -1 and any(k.replace("_", "") in col_clean for k in status_keywords):
            status_idx = idx
        elif watched_idx == -1 and any(k.replace("_", "") in col_clean for k in watched_keywords):
            watched_idx = idx
        elif total_idx == -1 and any(k.replace("_", "") in col_clean for k in total_keywords):
            total_idx = idx
        elif rating_idx == -1 and any(k.replace("_", "") in col_clean for k in rating_keywords):
            rating_idx = idx
        elif notes_idx == -1 and any(k.replace("_", "") in col_clean for k in notes_keywords):
            notes_idx = idx

    has_header = (title_idx != -1)
    data_lines = all_lines[1:] if has_header else all_lines
    if not has_header:
        # Fallback: assume column 0 is title
        title_idx = 0

    for line_num, cols in enumerate(data_lines, start=2 if has_header else 1):
        if not cols or len(cols) <= title_idx:
            continue

        raw_title = clean_title_string(cols[title_idx])
        if not raw_title:
            continue

        norm = normalize_title(raw_title)
        if norm in seen_titles:
            continue
        seen_titles.add(norm)

        # Parse optional fields
        status = AnimeStatus.PLANNED
        if status_idx != -1 and len(cols) > status_idx:
            status = parse_status_string(cols[status_idx])

        watched_eps = 0
        if watched_idx != -1 and len(cols) > watched_idx:
            watched_eps = parse_integer_val(cols[watched_idx])

        total_eps = None
        if total_idx != -1 and len(cols) > total_idx and cols[total_idx].strip():
            parsed_total = parse_integer_val(cols[total_idx])
            if parsed_total > 0:
                total_eps = parsed_total

        rating = None
        if rating_idx != -1 and len(cols) > rating_idx and cols[rating_idx].strip():
            rating = parse_rating_val(cols[rating_idx])

        notes = None
        if notes_idx != -1 and len(cols) > notes_idx and cols[notes_idx].strip():
            notes = cols[notes_idx].strip()[:2000]

        rows.append(ParsedImportRow(
            raw_title=raw_title[:255],
            status=status,
            watched_episodes=watched_eps,
            total_episodes=total_eps,
            rating=rating,
            notes=notes,
        ))

        if len(rows) >= 500:
            errors.append("Input reached maximum limit of 500 entries; subsequent lines omitted.")
            break

    return rows, errors


class ImportService:
    @staticmethod
    def parse_input(text_content: str, file_type: str = "text") -> ParseImportResponse:
        """Parse raw text or CSV content and return preview items."""
        if not text_content or not text_content.strip():
            return ParseImportResponse(total_rows=0, preview_items=[], errors=["Input content is empty."])

        if file_type.lower() == "csv":
            items, errors = parse_raw_csv(text_content)
        else:
            items = parse_raw_text(text_content)
            errors = []

        return ParseImportResponse(
            total_rows=len(items),
            preview_items=items,
            errors=errors,
        )

    @staticmethod
    async def create_import_job(
        db: Session,
        user_id: str,
        request: CreateImportJobRequest,
    ) -> ImportJob:
        """Create and populate an import job with items, then trigger discovery."""
        if not request.items:
            raise ValueError("No items provided for import.")
        if len(request.items) > 500:
            raise ValueError("Exceeded maximum batch limit of 500 items.")

        job = ImportJob(
            user_id=user_id,
            source_type=request.source_type,
            status="PROCESSING",
            total_items=len(request.items),
        )
        db.add(job)
        db.flush()

        for item in request.items:
            db_item = ImportJobItem(
                job_id=job.id,
                raw_title=item.raw_title,
                parsed_status=item.status.value,
                parsed_watched_episodes=item.watched_episodes,
                parsed_rating=item.rating,
                parsed_notes=item.notes,
                status="PENDING",
            )
            db.add(db_item)

        db.commit()
        db.refresh(job)

        # Run discovery process
        await ImportService.process_import_job(db, job.id)
        db.refresh(job)
        return job

    @staticmethod
    async def process_import_job(db: Session, job_id: str) -> None:
        """Enrich import items with provider metadata and evaluate matches."""
        job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
        if not job:
            return

        # Fetch existing user library to flag duplicates
        existing_library = db.query(AnimeEntry).filter(AnimeEntry.user_id == job.user_id).all()
        normalized_library_map = {e.normalized_title: e for e in existing_library}
        provider_media_map = {e.provider_media_id: e for e in existing_library if e.provider_media_id}

        provider = get_metadata_provider()

        for item in job.items:
            if item.status in ("IMPORTED", "SKIPPED"):
                continue

            try:
                candidates: List[ProviderAnimeCandidate] = await provider.search_anime(item.raw_title, limit=5)
                # Store serialized candidates
                item.candidates_json = [c.model_dump() for c in candidates]

                best_cand, eval_status, confidence, warning = TitleMatchingEngine.evaluate_candidates(
                    item.raw_title, candidates
                )

                if best_cand:
                    item.matched_title = best_cand.canonical_title or best_cand.title
                    item.matched_alternate_title = best_cand.english_title or best_cand.romaji_title
                    item.provider_media_id = best_cand.provider_id
                    item.poster_url = best_cand.poster_url
                    item.total_episodes = best_cand.total_episodes
                    item.match_confidence = confidence
                    item.match_warning = warning
                    item.status = eval_status
                else:
                    item.status = "UNMATCHED"
                    item.match_confidence = 0.0
                    item.match_warning = warning or "No matching anime found from metadata provider."

            except Exception as e:
                item.status = "UNMATCHED"
                item.match_confidence = 0.0
                item.error_message = f"Metadata lookup failed: {str(e)}"

            # Duplicate detection
            # Check by provider_id
            matched_dup = None
            if item.provider_media_id and item.provider_media_id in provider_media_map:
                matched_dup = provider_media_map[item.provider_media_id]
            else:
                # Check normalized title of match or raw
                test_titles = [item.matched_title, item.raw_title]
                for tt in test_titles:
                    if tt:
                        norm = normalize_title(tt)
                        if norm in normalized_library_map:
                            matched_dup = normalized_library_map[norm]
                            break

            if matched_dup:
                item.is_duplicate = True
                item.existing_anime_id = matched_dup.id
            else:
                item.is_duplicate = False
                item.existing_anime_id = None

        job.matched_items = sum(1 for it in job.items if it.status == "MATCHED")
        job.status = "REVIEW"
        db.commit()

    @staticmethod
    def update_item(
        db: Session,
        user_id: str,
        job_id: str,
        item_id: str,
        update_data: ImportItemUpdate,
    ) -> ImportJobItem:
        """Allow user to pick a different candidate or override fields before confirming."""
        job = db.query(ImportJob).filter(ImportJob.id == job_id, ImportJob.user_id == user_id).first()
        if not job:
            raise ValueError("Import job not found.")

        item = db.query(ImportJobItem).filter(ImportJobItem.id == item_id, ImportJobItem.job_id == job_id).first()
        if not item:
            raise ValueError("Import job item not found.")

        if update_data.skip is not None:
            if update_data.skip:
                item.status = "SKIPPED"
            elif item.status == "SKIPPED":
                item.status = "MATCHED" if item.matched_title else "UNMATCHED"

        if update_data.selected_provider_id:
            # Find candidate in stored candidates_json
            chosen = next(
                (c for c in item.candidates_json if c.get("provider_id") == update_data.selected_provider_id),
                None
            )
            if chosen:
                item.matched_title = chosen.get("canonical_title") or chosen.get("title")
                item.matched_alternate_title = chosen.get("english_title") or chosen.get("romaji_title")
                item.provider_media_id = chosen.get("provider_id")
                item.poster_url = chosen.get("poster_url")
                item.total_episodes = chosen.get("total_episodes")
                item.match_confidence = 1.0
                item.match_warning = None
                item.status = "MATCHED"

        if update_data.user_title is not None:
            item.matched_title = update_data.user_title.strip()[:255]
        if update_data.user_status is not None:
            item.parsed_status = update_data.user_status.value
        if update_data.watched_episodes is not None:
            item.parsed_watched_episodes = max(0, update_data.watched_episodes)
        if update_data.total_episodes is not None:
            item.total_episodes = max(1, update_data.total_episodes) if update_data.total_episodes > 0 else None
        if update_data.rating is not None:
            item.parsed_rating = max(1, min(10, update_data.rating))

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def confirm_import_job(
        db: Session,
        user_id: str,
        job_id: str,
        duplicate_actions: Dict[str, str],
    ) -> ImportJob:
        """
        Final transactional import of reviewed items into anime_entries.
        duplicate_actions maps item_id -> ('skip' | 'update_metadata' | 'merge_progress').
        """
        job = db.query(ImportJob).filter(ImportJob.id == job_id, ImportJob.user_id == user_id).first()
        if not job:
            raise ValueError("Import job not found.")
        if job.status == "COMPLETED":
            return job

        provider = get_metadata_provider()
        imported_count = 0
        skipped_count = 0
        failed_count = 0

        # Maintain library set to prevent inserting duplicates within this batch
        existing_library = db.query(AnimeEntry).filter(AnimeEntry.user_id == user_id).all()
        normalized_existing = {e.normalized_title for e in existing_library}

        for item in job.items:
            if item.status == "SKIPPED":
                skipped_count += 1
                continue

            try:
                if item.is_duplicate and item.existing_anime_id:
                    action = duplicate_actions.get(item.id, "skip").lower()
                    if action == "skip":
                        item.status = "SKIPPED"
                        skipped_count += 1
                        continue

                    existing = db.query(AnimeEntry).filter(
                        AnimeEntry.id == item.existing_anime_id,
                        AnimeEntry.user_id == user_id
                    ).first()

                    if existing:
                        # Update metadata fields
                        if item.poster_url and not existing.poster_url:
                            existing.poster_url = item.poster_url
                        if item.total_episodes and not existing.total_episodes:
                            existing.total_episodes = item.total_episodes
                            existing.total_episodes_source = "METADATA_PROVIDER"
                        if item.provider_media_id:
                            existing.metadata_provider = provider.name
                            existing.provider_media_id = item.provider_media_id
                            existing.metadata_last_checked_at = datetime.now(timezone.utc)
                            existing.metadata_last_updated_at = datetime.now(timezone.utc)

                        if action == "merge_progress":
                            if item.parsed_watched_episodes > existing.watched_episodes:
                                existing.watched_episodes = item.parsed_watched_episodes
                            if item.parsed_rating is not None and existing.rating is None:
                                existing.rating = item.parsed_rating
                            if item.parsed_status and existing.status == AnimeStatus.PLANNED.value:
                                existing.status = item.parsed_status
                            if item.parsed_notes and not existing.notes:
                                existing.notes = item.parsed_notes

                        item.status = "IMPORTED"
                        imported_count += 1
                        continue

                # New anime entry
                title_to_use = item.matched_title or item.raw_title
                norm_title = normalize_title(title_to_use)

                if norm_title in normalized_existing:
                    # Duplicate detected within session
                    item.status = "SKIPPED"
                    skipped_count += 1
                    continue

                watched = item.parsed_watched_episodes or 0
                total = item.total_episodes
                if total and watched > total:
                    watched = total

                entry = AnimeEntry(
                    user_id=user_id,
                    title=title_to_use[:255],
                    normalized_title=norm_title[:255],
                    alternate_title=item.matched_alternate_title[:255] if item.matched_alternate_title else None,
                    poster_url=item.poster_url,
                    status=item.parsed_status or AnimeStatus.PLANNED.value,
                    total_episodes=total,
                    watched_episodes=watched,
                    rating=item.parsed_rating,
                    notes=item.parsed_notes,
                    is_favorite=False,
                    genres=[],
                    metadata_provider=provider.name if item.provider_media_id else None,
                    provider_media_id=item.provider_media_id,
                    metadata_last_checked_at=datetime.now(timezone.utc) if item.provider_media_id else None,
                    metadata_last_updated_at=datetime.now(timezone.utc) if item.provider_media_id else None,
                    metadata_sync_status="CURRENT",
                    total_episodes_source="METADATA_PROVIDER" if item.provider_media_id else "MANUAL",
                )
                db.add(entry)
                normalized_existing.add(norm_title)
                item.status = "IMPORTED"
                imported_count += 1

            except Exception as e:
                item.status = "FAILED"
                item.error_message = str(e)
                failed_count += 1

        job.imported_items = imported_count
        job.skipped_items = skipped_count
        job.failed_items = failed_count
        job.status = "COMPLETED"

        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def cancel_job(db: Session, user_id: str, job_id: str) -> ImportJob:
        """Cancel an import job in REVIEW or PENDING state."""
        job = db.query(ImportJob).filter(ImportJob.id == job_id, ImportJob.user_id == user_id).first()
        if not job:
            raise ValueError("Import job not found.")
        if job.status not in ("PENDING", "PROCESSING", "REVIEW"):
            return job

        job.status = "CANCELLED"
        for item in job.items:
            if item.status not in ("IMPORTED", "SKIPPED"):
                item.status = "SKIPPED"
        db.commit()
        db.refresh(job)
        return job
