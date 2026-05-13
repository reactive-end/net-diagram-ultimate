<?php

declare(strict_types=1);

/**
 * Simple data validation helper.
 * Returns an array of error messages (empty = valid).
 */
class Validator
{
    private array $errors = [];

    /**
     * Run validation rules against data.
     *
     * Rules format: ['field' => 'rule1|rule2', ...]
     * Available rules: required, email, numeric, min:N, max:N, ip, alphanumeric
     */
    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $ruleList = explode('|', $ruleString);

            foreach ($ruleList as $rule) {
                $params = [];
                if (str_contains($rule, ':')) {
                    [$rule, $paramStr] = explode(':', $rule, 2);
                    $params = explode(',', $paramStr);
                }

                $methodName = 'rule' . ucfirst($rule);
                if (method_exists($this, $methodName)) {
                    $error = $this->$methodName($field, $value, $params);
                    if ($error !== null) {
                        $this->errors[$field][] = $error;
                    }
                }
            }
        }

        return empty($this->errors);
    }

    /**
     * Get validation errors.
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Get the first error message.
     */
    public function firstError(): ?string
    {
        foreach ($this->errors as $fieldErrors) {
            return $fieldErrors[0];
        }
        return null;
    }

    // --- Rule methods ---

    private function ruleRequired(string $field, mixed $value, array $params): ?string
    {
        if ($value === null || $value === '' || (is_array($value) && empty($value))) {
            return "{$field} es requerido.";
        }
        return null;
    }

    private function ruleNumeric(string $field, mixed $value, array $params): ?string
    {
        if ($value !== null && $value !== '' && !is_numeric($value)) {
            return "{$field} debe ser un número.";
        }
        return null;
    }

    private function ruleMin(string $field, mixed $value, array $params): ?string
    {
        $min = (int) ($params[0] ?? 0);
        if (is_string($value) && mb_strlen($value) < $min) {
            return "{$field} debe tener al menos {$min} caracteres.";
        }
        if (is_numeric($value) && (float) $value < $min) {
            return "{$field} debe ser al menos {$min}.";
        }
        return null;
    }

    private function ruleMax(string $field, mixed $value, array $params): ?string
    {
        $max = (int) ($params[0] ?? 255);
        if (is_string($value) && mb_strlen($value) > $max) {
            return "{$field} no debe exceder {$max} caracteres.";
        }
        return null;
    }

    private function ruleIp(string $field, mixed $value, array $params): ?string
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_IP)) {
            return "{$field} no es una IP válida.";
        }
        return null;
    }

    private function ruleAlphanumeric(string $field, mixed $value, array $params): ?string
    {
        if ($value !== null && $value !== '' && !ctype_alnum(str_replace([' ', '-', '_'], '', $value))) {
            return "{$field} contiene caracteres no permitidos.";
        }
        return null;
    }

    private function ruleInteger(string $field, mixed $value, array $params): ?string
    {
        if ($value !== null && $value !== '' && !ctype_digit((string) $value)) {
            return "{$field} debe ser un entero.";
        }
        return null;
    }
}
