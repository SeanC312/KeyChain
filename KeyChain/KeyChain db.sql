CREATE TABLE master (
    id UUID PRIMARY KEY,  -- Native UUID type
    encrypted_username VARCHAR(255) NOT NULL,
    username_iv VARCHAR(255) NOT NULL,
    username_salt VARCHAR(255) NOT NULL,
    hashed_username VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL
);


CREATE TABLE subaccount (
    master_id UUID NOT NULL,
    encrypted_username VARCHAR(255) NOT NULL,
    username_iv VARCHAR(255) NOT NULL,
    username_salt VARCHAR(255) NOT NULL,
    hashed_username VARCHAR(255) NOT NULL,
    
    encrypted_password VARCHAR(255) NOT NULL,
    password_iv VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    
    encrypted_domain VARCHAR(255) NOT NULL,
    domain_iv VARCHAR(255) NOT NULL,
    domain_salt VARCHAR(255) NOT NULL,
    hashed_domain VARCHAR(255) NOT NULL,
    
    encrypted_timestamp VARCHAR(255) NOT NULL,
    timestamp_salt VARCHAR(255) NOT NULL,
    timestamp_iv VARCHAR(255) NOT NULL,

    PRIMARY KEY (hashed_username, hashed_domain),
    FOREIGN KEY (master_id) REFERENCES master(id) ON DELETE CASCADE
);
