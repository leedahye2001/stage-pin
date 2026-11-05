CREATE TABLE goods_listing (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES member_account(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    artist VARCHAR(60) NOT NULL CHECK (length(trim(artist)) > 0),
    title VARCHAR(80) NOT NULL CHECK (length(trim(title)) > 0),
    kind VARCHAR(8) NOT NULL CHECK (kind IN ('SALE', 'EXCHANGE')),
    price BIGINT,
    wanted VARCHAR(200) NOT NULL DEFAULT '',
    condition_code VARCHAR(24) NOT NULL CHECK (condition_code IN ('SEALED', 'OPENED_UNUSED', 'USED_GOOD', 'USED_FAIR', 'DAMAGED')),
    description VARCHAR(1000) NOT NULL DEFAULT '',
    onsite BOOLEAN NOT NULL,
    delivery BOOLEAN NOT NULL,
    event VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (owner_id, request_id),
    CHECK (onsite OR delivery),
    CHECK (NOT onsite OR (event IS NOT NULL AND length(trim(event)) > 0)),
    CHECK ((kind = 'SALE' AND price IS NOT NULL AND price BETWEEN 1 AND 100000000 AND wanted = '')
        OR (kind = 'EXCHANGE' AND price IS NULL AND length(trim(wanted)) > 0))
);
CREATE INDEX goods_listing_created ON goods_listing(created_at DESC, id DESC);
CREATE INDEX goods_listing_owner ON goods_listing(owner_id, created_at DESC);

CREATE TABLE goods_photo (
    id UUID PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES goods_listing(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL CHECK (position BETWEEN 0 AND 4),
    width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 1600),
    height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 1600),
    content BYTEA NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 2097152),
    UNIQUE (listing_id, position)
);
