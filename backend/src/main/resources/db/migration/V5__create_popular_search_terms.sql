CREATE TABLE popular_search_term (
    term VARCHAR(80) PRIMARY KEY,
    search_count BIGINT NOT NULL DEFAULT 0 CHECK (search_count >= 0),
    seed_rank INTEGER NOT NULL UNIQUE
);

INSERT INTO popular_search_term (term, seed_rank) VALUES
('DAY6', 1), ('BTS', 2), ('SEVENTEEN', 3), ('IVE', 4), ('aespa', 5),
('NCT', 6), ('Stray Kids', 7), ('TXT', 8), ('ENHYPEN', 9), ('LE SSERAFIM', 10);
