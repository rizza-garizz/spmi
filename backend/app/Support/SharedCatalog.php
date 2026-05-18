<?php

namespace App\Support;

class SharedCatalog
{
    public static function metadata(): array
    {
        return self::loadCatalog()['metadata'] ?? [];
    }

    public static function metrics(): array
    {
        return self::loadCatalog()['metrics'] ?? [];
    }

    public static function standards(): array
    {
        return self::loadCatalog()['standards'] ?? [];
    }

    public static function standardCategories(): array
    {
        return self::loadCatalog()['standardCategories'] ?? [];
    }

    public static function standardCategoryKeys(): array
    {
        return array_map(static fn (array $category) => $category['key'] ?? '', self::standardCategories());
    }

    public static function documentTypes(): array
    {
        return self::loadCatalog()['documentTypes'] ?? [];
    }

    public static function importTypes(): array
    {
        return self::loadCatalog()['importTypes'] ?? [];
    }

    public static function surveyTargets(): array
    {
        return self::loadCatalog()['surveyTargets'] ?? [];
    }

    public static function documents(): array
    {
        return self::loadCatalog()['documents'] ?? [];
    }

    public static function ppeppSteps(): array
    {
        return self::loadCatalog()['ppeppSteps'] ?? [];
    }

    public static function documentGroups(): array
    {
        return self::loadCatalog()['documentGroups'] ?? [];
    }

    public static function dashboardModules(): array
    {
        return self::loadCatalog()['dashboardModules'] ?? [];
    }

    public static function integrations(): array
    {
        return self::loadCatalog()['integrations'] ?? [];
    }

    public static function qualityChecklist(): array
    {
        return self::loadCatalog()['qualityChecklist'] ?? [];
    }

    public static function roles(): array
    {
        return self::loadCatalog()['roles'] ?? [];
    }

    public static function orgUnits(): array
    {
        return self::loadCatalog()['orgUnits'] ?? [];
    }

    public static function seedUsers(): array
    {
        return self::loadCatalog()['seedUsers'] ?? [];
    }

    public static function snapshot(): array
    {
        $catalog = self::loadCatalog();

        return [
            'metadata' => $catalog['metadata'] ?? [],
            'metrics' => $catalog['metrics'] ?? [],
            'standardCategories' => $catalog['standardCategories'] ?? [],
            'standards' => $catalog['standards'] ?? [],
            'documentTypes' => $catalog['documentTypes'] ?? [],
            'importTypes' => $catalog['importTypes'] ?? [],
            'documents' => $catalog['documents'] ?? [],
            'ppeppCycles' => $catalog['ppeppCycles'] ?? [],
            'amiAudits' => $catalog['amiAudits'] ?? [],
            'rtmMeetings' => $catalog['rtmMeetings'] ?? [],
            'surveys' => $catalog['surveys'] ?? [],
            'integrations' => $catalog['integrations'] ?? [],
            'imports' => $catalog['imports'] ?? [],
            'dashboardModules' => $catalog['dashboardModules'] ?? [],
            'ppeppSteps' => $catalog['ppeppSteps'] ?? [],
            'documentGroups' => $catalog['documentGroups'] ?? [],
            'qualityChecklist' => $catalog['qualityChecklist'] ?? [],
            'roles' => $catalog['roles'] ?? [],
            'orgUnits' => $catalog['orgUnits'] ?? [],
            'seedUsers' => array_map(static function (array $user) {
                return [
                    'name' => $user['name'] ?? '',
                    'email' => $user['email'] ?? '',
                    'role' => $user['role'] ?? null,
                ];
            }, $catalog['seedUsers'] ?? []),
        ];
    }

    private static function loadCatalog(): array
    {
        $path = base_path('../frontend/data/spmi-catalog.json');

        if (!file_exists($path)) {
            return [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : [];
    }
}
