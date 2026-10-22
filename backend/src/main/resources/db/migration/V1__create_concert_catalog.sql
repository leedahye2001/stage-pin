CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE artist (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    image_url VARCHAR(1000)
);

CREATE TABLE venue (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(120) NOT NULL,
    country_code CHAR(2) NOT NULL,
    address VARCHAR(500),
    timezone VARCHAR(60) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    location GEOGRAPHY(POINT, 4326) NOT NULL
);

CREATE INDEX idx_venue_location ON venue USING GIST (location);

CREATE TABLE concert (
    id UUID PRIMARY KEY,
    title VARCHAR(240) NOT NULL,
    venue_id UUID NOT NULL REFERENCES venue(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL,
    poster_url VARCHAR(1000),
    official_url VARCHAR(1000) NOT NULL,
    source VARCHAR(80) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT chk_concert_period CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_concert_starts_at ON concert (starts_at);

CREATE TABLE concert_artist (
    concert_id UUID NOT NULL REFERENCES concert(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artist(id),
    role VARCHAR(30) NOT NULL DEFAULT 'HEADLINER',
    PRIMARY KEY (concert_id, artist_id)
);

CREATE TABLE concert_schedule (
    id UUID PRIMARY KEY,
    concert_id UUID NOT NULL REFERENCES concert(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    timezone VARCHAR(60) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    description VARCHAR(500),
    CONSTRAINT chk_schedule_period CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_schedule_concert ON concert_schedule (concert_id, starts_at);
