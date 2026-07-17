<?php
namespace Emailsly;

final class Router
{
    /** @var array<string, array<array{pattern:string,handler:mixed,params:array}>> */
    private array $routes = [];

    public function get(string $p, mixed $h): void    { $this->add('GET', $p, $h); }
    public function post(string $p, mixed $h): void   { $this->add('POST', $p, $h); }
    public function put(string $p, mixed $h): void    { $this->add('PUT', $p, $h); }
    public function patch(string $p, mixed $h): void  { $this->add('PATCH', $p, $h); }
    public function delete(string $p, mixed $h): void { $this->add('DELETE', $p, $h); }

    private function add(string $method, string $path, mixed $handler): void
    {
        $params = [];
        $regex = preg_replace_callback('#\{([^/}]+)\}#', function ($m) use (&$params) {
            $params[] = $m[1];
            return '([^/]+)';
        }, $path);
        $this->routes[$method][] = [
            'pattern' => '#^' . $regex . '$#',
            'handler' => $handler,
            'params'  => $params,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        $path = rtrim($path, '/') ?: '/';
        foreach ($this->routes[$method] ?? [] as $r) {
            if (preg_match($r['pattern'], $path, $m)) {
                array_shift($m);
                $args = array_combine($r['params'], $m) ?: [];
                $h = $r['handler'];
                if (is_array($h)) {
                    [$class, $method2] = $h;
                    (new $class())->$method2($args);
                } else {
                    $h($args);
                }
                return;
            }
        }
        Response::notFound('Route not found: ' . $method . ' ' . $path);
    }
}
