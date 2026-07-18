<?php
declare(strict_types=1);
// JWTs are stateless; the client discards the token. Respond OK for parity.
Response::json(['ok' => true]);
