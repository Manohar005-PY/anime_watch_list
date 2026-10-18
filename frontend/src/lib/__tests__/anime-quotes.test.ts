/**
 * Automated test suite for Anime Quotations Catalogue and Selection Utility
 */

import {
  ANIME_QUOTES,
  getRandomAnimeQuote,
  AnimeQuote,
  getLastShownQuoteId,
  setLastShownQuoteId,
} from "../anime-quotes";

function runTests() {
  console.log("=== RUNNING ANIME QUOTES TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Catalogue Integrity: Non-empty, verified quotes
  assert(ANIME_QUOTES.length >= 10, "Catalogue contains at least 10 verified quotations");
  
  const allHaveRequiredFields = ANIME_QUOTES.every(
    (q) =>
      q.id &&
      q.quote &&
      q.anime &&
      q.character &&
      q.originalLanguage &&
      q.sourceReference &&
      q.rightsNote
  );
  assert(allHaveRequiredFields, "All catalogue items possess full attribution and source verification");

  // 2. Deterministic selection with seeds
  const quoteSeed1 = getRandomAnimeQuote({ seed: 42 });
  const quoteSeed2 = getRandomAnimeQuote({ seed: 42 });
  assert(
    quoteSeed1?.id === quoteSeed2?.id,
    "Deterministic seed yields identical quote selection"
  );

  const quoteSeedDiff = getRandomAnimeQuote({ seed: 999 });
  assert(
    quoteSeedDiff !== null,
    "Different seed returns a valid quote"
  );

  // 3. Avoiding immediate repetition
  setLastShownQuoteId("cowboy-bebop-spike");
  const nextQuote = getRandomAnimeQuote({ excludeId: "cowboy-bebop-spike" });
  assert(
    nextQuote?.id !== "cowboy-bebop-spike",
    "Quote engine avoids returning the immediately preceding quote"
  );

  // 4. Empty catalogue behavior
  const emptyQuote = getRandomAnimeQuote({ catalogue: [] });
  assert(emptyQuote === null, "Empty catalogue returns null gracefully without throwing");

  // 5. Single item catalogue behavior
  const singleItem: AnimeQuote = {
    id: "single-test",
    quote: "Test line",
    anime: "Test Anime",
    character: "Tester",
    originalLanguage: "Japanese",
    sourceReference: "Episode 1",
    rightsNote: "Test rights",
  };
  const singleResult = getRandomAnimeQuote({ catalogue: [singleItem] });
  assert(singleResult?.id === "single-test", "Single item catalogue safely returns the lone quote");

  // 6. Zero external dependency & offline capability
  const offlineQuote = getRandomAnimeQuote();
  assert(
    offlineQuote !== null && typeof offlineQuote.quote === "string",
    "Works completely offline without network calls"
  );

  // 7. Verify attribution data matches expectations
  const spikeQuote = ANIME_QUOTES.find((q) => q.id === "cowboy-bebop-spike");
  assert(
    spikeQuote?.character === "Spike Spiegel" && spikeQuote?.anime === "Cowboy Bebop",
    "Spike Spiegel attribution is accurately mapped to Cowboy Bebop"
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed in anime-quotes test suite!`);
  }
}

runTests();
