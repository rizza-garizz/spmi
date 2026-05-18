<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\OrgUnit;
use App\Models\MutuStandard;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use App\Support\SharedCatalog;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [];
        foreach (SharedCatalog::roles() as $roleData) {
            $roles[$roleData['name']] = Role::findOrCreate($roleData['name']);
        }

        foreach (SharedCatalog::orgUnits() as $unitData) {
            OrgUnit::query()->firstOrCreate(
                ['code' => $unitData['code']],
                [
                    'name' => $unitData['name'],
                    'type' => $unitData['type'],
                    'parent_id' => $unitData['parent_id'] ?? null,
                ]
            );
        }

        $seedUsers = SharedCatalog::seedUsers();
        $primaryAdmin = null;

        foreach ($seedUsers as $userData) {
            $user = User::query()->firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                ]
            );

            $roleName = $userData['role'] ?? null;

            if ($roleName && isset($roles[$roleName])) {
                $user->assignRole($roles[$roleName]);
            }

            if ($roleName === 'admin') {
                $primaryAdmin = $user;
            }
        }

        $admin = $primaryAdmin ?? User::query()->where('email', 'admin@spmi.local')->first();

        foreach (SharedCatalog::standards() as $standardData) {
            MutuStandard::query()->firstOrCreate(
                ['code' => $standardData['code']],
                [
                    'title' => $standardData['title'],
                    'category' => $standardData['category'],
                    'description' => $standardData['description'],
                    'status' => 'active',
                    'published_at' => now(),
                    'published_by' => $admin?->id,
                ]
            );
        }
    }
}
