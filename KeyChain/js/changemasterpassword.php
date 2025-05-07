<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->uuid) || !isset($data->newHashedUsername) ||
    !isset($data->newHashedPassword) || !isset($data->newEncryptedUsername) ||
    !isset($data->newEncryptedUsernameIV) || !isset($data->newEncryptedUsernameSalt) ||
    !isset($data->updatedSubaccounts)
) {
    echo json_encode(["error" => "Missing data"]);
    exit;
}

// DB connection
$host = "localhost";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "password";
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Extract master account fields
$uuid = $data->uuid;
$newHashedUsername = $data->newHashedUsername;
$newHashedPassword = $data->newHashedPassword;
$newEncryptedUsername = $data->newEncryptedUsername;
$newEncryptedUsernameIV = $data->newEncryptedUsernameIV;
$newEncryptedUsernameSalt = $data->newEncryptedUsernameSalt;

// Update master account
$updateMasterQuery = "UPDATE master 
                      SET hashed_username = $1,
                          hashed_password = $2,
                          encrypted_username = $3,
                          username_iv = $4,
                          username_salt = $5
                      WHERE id = $6;";

$result = pg_query_params($conn, $updateMasterQuery, [
    $newHashedUsername,
    $newHashedPassword,
    $newEncryptedUsername,
    $newEncryptedUsernameIV,
    $newEncryptedUsernameSalt,
    $uuid
]);

if (!$result) {
    echo json_encode(["error" => "Failed to update master account"]);
    pg_close($conn);
    exit;
}

// Update subaccounts
foreach ($data->updatedSubaccounts as $sub) {
    if (
        !isset($sub->hashed_username) || !isset($sub->hashed_domain) ||
        !isset($sub->encrypted_username) || !isset($sub->username_iv) || !isset($sub->username_salt) ||
        !isset($sub->encrypted_password) || !isset($sub->password_iv) || !isset($sub->password_salt) ||
        !isset($sub->encrypted_domain) || !isset($sub->domain_iv) || !isset($sub->domain_salt) ||
        !isset($sub->encrypted_timestamp) || !isset($sub->timestamp_iv) || !isset($sub->timestamp_salt)
    ) {
        echo json_encode(["error" => "Missing Fields"]);
        pg_close($conn);
        exit;
    }

    $updateSubQuery = "UPDATE subaccount
        SET encrypted_username = $1, username_iv = $2, username_salt = $3,
            encrypted_password = $4, password_iv = $5, password_salt = $6,
            encrypted_domain = $7, domain_iv = $8, domain_salt = $9,
            encrypted_timestamp = $10, timestamp_iv = $11, timestamp_salt = $12
        WHERE master_id = $13 AND hashed_username = $14 AND hashed_domain = $15;";

    $res = pg_query_params($conn, $updateSubQuery, [
        $sub->encrypted_username,
        $sub->username_iv,
        $sub->username_salt,
        $sub->encrypted_password,
        $sub->password_iv,
        $sub->password_salt,
        $sub->encrypted_domain,
        $sub->domain_iv,
        $sub->domain_salt,
        $sub->encrypted_timestamp,
        $sub->timestamp_iv,
        $sub->timestamp_salt,
        $uuid,
        $sub->hashed_username,
        $sub->hashed_domain
    ]);
    error_log(print_r($sub, true));

    if (!$res) {
        echo json_encode(["error" => "Failed to update one or more subaccounts"]);
        pg_close($conn);
        exit;
    }
}

pg_close($conn);
echo json_encode(["success" => true]);
exit;
?>
