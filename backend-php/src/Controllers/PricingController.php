<?php
namespace Emailsly\Controllers;
use Emailsly\{Database, Response};

final class PricingController
{
    public function listPublic(): void
    {
        $s = Database::pdo()->query('SELECT service_id,name,category,rate,min_qty,min_order,helper,currency FROM pricing_settings WHERE published = 1 ORDER BY sort_order, name');
        Response::json(['services' => $s->fetchAll()]);
    }
}
