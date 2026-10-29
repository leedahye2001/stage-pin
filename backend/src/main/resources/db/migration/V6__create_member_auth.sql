CREATE TABLE member_account (
    id UUID PRIMARY KEY,
    nickname VARCHAR(80) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_identity (
    provider VARCHAR(20) NOT NULL,
    subject VARCHAR(128) NOT NULL,
    member_id UUID NOT NULL REFERENCES member_account(id) ON DELETE CASCADE,
    PRIMARY KEY (provider, subject)
);

CREATE TABLE member_login_attempt (
    id UUID PRIMARY KEY,
    state_hash CHAR(64) UNIQUE,
    exchange_hash CHAR(64) UNIQUE,
    challenge VARCHAR(43) NOT NULL,
    client_type VARCHAR(6) NOT NULL CHECK (client_type IN ('WEB', 'NATIVE')),
    member_id UUID REFERENCES member_account(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX member_login_expiry ON member_login_attempt(expires_at);

CREATE TABLE member_session (
    token_hash CHAR(64) PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES member_account(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX member_session_expiry ON member_session(expires_at);
