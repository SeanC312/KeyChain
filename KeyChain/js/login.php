<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Methods: Content-Type');

$host = "localhost";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "password";

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if(!$conn){
    echo json_encode(["Error" => "Failed to connect to database!"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->enteredUsername) || !isset($data->enteredPassword)) {
    echo json_encode(["error" => "Missing username or password"]);
    exit;
}

// Need to match hashedUsername with a hashed username already in the database.
// $username = $data->base64Username;

// Password to be compared with the one stored in the db
// $enteredPassword = $data->base64Password;

error_log("Decoded username: " . $data->enteredUsername);

$username = $data->enteredUsername;

error_log("Escaped username: " . $username);

$enteredPassword = $data->enteredPassword;

error_log("Entered password (decoded): " . $enteredPassword); 

// Create an SQL query to match usernames
$query = "SELECT hashed_password FROM master WHERE hashed_username = $1";
$result = pg_query_params($conn, $query, array($username));

// Boolean to see if authentication was successful.
$validLogin = false;


if ($row = pg_fetch_assoc($result)) {
    $storedPassword = $row['hashed_password'];

    error_log("Stored Password: " . $storedPassword);
    error_log("Entered Password: " . $enteredPassword);


    if ($enteredPassword == $storedPassword) {
        $validLogin = true;
    } else {

        error_log("No data found for username: " . $username);
        echo json_encode(["error" => "Authentication Failure - No username found in db"]);
        exit;
    }

}
else{
    
    echo json_encode(["error" => "Authentication Failure 2"]);
}

$query = "SELECT id, encrypted_username, username_salt, 
        username_iv FROM master WHERE hashed_username = $1";

// Now that authentication is proven true, the username still needs to be decrypted
// New query
$result = pg_query_params($conn, $query, array($username));

if ($row = pg_fetch_assoc($result)) {

    $encryptedUsername = $row['encrypted_username'];

    $encryption_salt = $row['username_salt'];

    $encryption_iv= $row['username_iv'];


    if($validLogin){
        // User is authenticated, now send back username + salt + IV to decrypt client-side
        echo json_encode([
       "success" => "Authentication Successful",
       "uuid" => $row['id'],
       "encrypted_username" => $encryptedUsername,
       "encryption_salt" => $encryption_salt,
       "encryption_iv" => $encryption_iv
        ]);
            exit;
    } else {
        error_log(print_r($data, true));
        echo json_encode(["error" => "Authentication Failure 3"]);
        exit;
}
}

if ($validLogin) {
    echo json_encode(["success" => "Authentication Successful"]);
} else {
    echo json_encode(["error" => "Authentication Failure"]);
}

pg_close($conn);


?>