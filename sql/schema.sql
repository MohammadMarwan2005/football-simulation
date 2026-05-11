CREATE TABLE IF NOT EXISTS sessions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Network / server-derived
    ip              VARCHAR(45),
    country         VARCHAR(64),
    region          VARCHAR(128),
    city            VARCHAR(128),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    isp             VARCHAR(255),
    geo_timezone    VARCHAR(64),

    -- HTTP request headers
    user_agent      TEXT,
    browser         VARCHAR(64),
    os              VARCHAR(64),
    device_type     VARCHAR(32),
    referer         TEXT,
    accept_language VARCHAR(255),

    -- Browser-reported
    language        VARCHAR(32),
    languages       TEXT,
    timezone        VARCHAR(64),

    -- Screen / window
    screen_w        INT,
    screen_h        INT,
    viewport_w      INT,
    viewport_h      INT,
    pixel_ratio     FLOAT,

    -- Hardware hints
    cpu_cores       INT,
    device_memory   FLOAT,
    gpu_vendor      VARCHAR(128),
    gpu_renderer    VARCHAR(255),
    touch_support   TINYINT(1),
    cookies_enabled TINYINT(1),
    do_not_track    VARCHAR(8),

    -- Network info
    connection_type VARCHAR(16),
    downlink        FLOAT,
    rtt             INT,

    -- Identity / page
    fingerprint     VARCHAR(64),
    page_url        TEXT,
    raw_json        JSON,

    INDEX idx_created (created_at),
    INDEX idx_ip (ip),
    INDEX idx_fingerprint (fingerprint),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
