CREATE TABLE member_favorite (
    member_id UUID NOT NULL REFERENCES member_account(id) ON DELETE CASCADE,
    kind VARCHAR(7) NOT NULL CHECK (kind IN ('ARTIST', 'CONCERT')),
    target_id VARCHAR(160) NOT NULL,
    snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id, kind, target_id)
);
CREATE INDEX member_favorite_order ON member_favorite(member_id, created_at DESC);
