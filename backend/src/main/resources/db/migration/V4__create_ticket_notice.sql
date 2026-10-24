CREATE TABLE ticket_notice (
    id UUID PRIMARY KEY,
    source_url VARCHAR(1000) NOT NULL,
    source_text TEXT NOT NULL,
    extracted_json TEXT NOT NULL,
    reviewed_json TEXT,
    model VARCHAR(120) NOT NULL,
    prompt_version VARCHAR(40) NOT NULL,
    latency_ms BIGINT NOT NULL,
    total_tokens BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ
);
CREATE INDEX idx_ticket_notice_created_at ON ticket_notice(created_at DESC);
