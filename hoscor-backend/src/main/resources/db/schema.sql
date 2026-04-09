-- ============================================================
-- HosCor Hospital Coordination Schema
-- ============================================================

-- app_users
CREATE TABLE IF NOT EXISTS app_users (
    id                   BIGSERIAL PRIMARY KEY,
    username             VARCHAR(50)  UNIQUE NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    role                 VARCHAR(50)  NOT NULL,
    unit                 VARCHAR(10),
    email                VARCHAR(100) UNIQUE,
    active               BOOLEAN      NOT NULL DEFAULT TRUE,
    validation_token     VARCHAR(100),
    reset_token          VARCHAR(100),
    reset_token_expiry   TIMESTAMP,
    created_at           TIMESTAMP    DEFAULT NOW()
);
-- Add new columns to existing installations
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email              VARCHAR(100) UNIQUE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS active             BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS validation_token   VARCHAR(100);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS reset_token        VARCHAR(100);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS unit               VARCHAR(10);
ALTER TABLE app_users ALTER COLUMN role TYPE VARCHAR(50);

-- beds
CREATE TABLE IF NOT EXISTS beds (
    id                 BIGSERIAL PRIMARY KEY,
    unit               VARCHAR(10)  NOT NULL,
    bed_number         VARCHAR(10)  NOT NULL,
    state              VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    last_updated       TIMESTAMP    DEFAULT NOW(),
    reserved_until     TIMESTAMP,
    reserved_by_user_id BIGINT REFERENCES app_users(id),
    UNIQUE(unit, bed_number)
);

-- patients
CREATE TABLE IF NOT EXISTS patients (
    id               BIGSERIAL PRIMARY KEY,
    mrd_number       VARCHAR(20)  UNIQUE NOT NULL,
    first_name       VARCHAR(50)  NOT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    age              INT          NOT NULL,
    gender           VARCHAR(10)  NOT NULL,
    diagnosis        VARCHAR(200) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ADMITTED',
    bed_number       VARCHAR(10),
    unit             VARCHAR(10),
    admission_date   TIMESTAMP    NOT NULL,
    discharge_date   TIMESTAMP,
    discharge_reason VARCHAR(20)
);

-- stretchers
CREATE TABLE IF NOT EXISTS stretchers (
    id               BIGSERIAL PRIMARY KEY,
    stretcher_number VARCHAR(20)  UNIQUE NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'WAITING',
    risk_level       VARCHAR(10)  NOT NULL,
    patient_id       BIGINT REFERENCES patients(id),
    wait_since       TIMESTAMP    NOT NULL DEFAULT NOW(),
    target_unit      VARCHAR(10)
);

-- transfers
CREATE TABLE IF NOT EXISTS transfers (
    id                    BIGSERIAL PRIMARY KEY,
    patient_id            BIGINT       NOT NULL REFERENCES patients(id),
    transfer_type         VARCHAR(10)  NOT NULL,
    origin_hospital       VARCHAR(100),
    destination_hospital  VARCHAR(100),
    scheduled_at          TIMESTAMP    NOT NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE',
    transport_type        VARCHAR(50),
    notes                 TEXT,
    created_at            TIMESTAMP    DEFAULT NOW()
);

-- attributions
CREATE TABLE IF NOT EXISTS attributions (
    id               BIGSERIAL PRIMARY KEY,
    bed_id           BIGINT       NOT NULL REFERENCES beds(id),
    stretcher_number VARCHAR(20)  NOT NULL,
    assigned_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- diagnosis_avg_los
CREATE TABLE IF NOT EXISTS diagnosis_avg_los (
    diagnosis_code VARCHAR(50) PRIMARY KEY,
    avg_los_hours  NUMERIC(6,2) NOT NULL
);

-- action_audit_log
CREATE TABLE IF NOT EXISTS action_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES app_users(id),
    action_type VARCHAR(50)  NOT NULL,
    params_json TEXT,
    timestamp   TIMESTAMP    NOT NULL DEFAULT NOW(),
    result_json TEXT,
    status      VARCHAR(20)  NOT NULL
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_beds_unit        ON beds(unit);
CREATE INDEX IF NOT EXISTS idx_beds_state       ON beds(state);
CREATE INDEX IF NOT EXISTS idx_patients_status  ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_unit    ON patients(unit);
CREATE INDEX IF NOT EXISTS idx_stretchers_status     ON stretchers(status);
CREATE INDEX IF NOT EXISTS idx_stretchers_risk_level ON stretchers(risk_level);
CREATE INDEX IF NOT EXISTS idx_transfers_status       ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_scheduled_at ON transfers(scheduled_at);
