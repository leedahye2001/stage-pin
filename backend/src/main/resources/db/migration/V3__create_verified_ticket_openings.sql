CREATE TABLE ticket_opening (
    id UUID PRIMARY KEY,
    concert_id UUID,
    concert_title VARCHAR(240) NOT NULL,
    artist_name VARCHAR(120) NOT NULL,
    poster_url VARCHAR(1000),
    type VARCHAR(40) NOT NULL,
    opens_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(60) NOT NULL,
    vendor VARCHAR(40) NOT NULL,
    ticket_url VARCHAR(1000) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ticket_opening_opens_at ON ticket_opening (opens_at);
