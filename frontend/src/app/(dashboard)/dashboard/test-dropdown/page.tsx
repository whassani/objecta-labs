'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TestDropdownPage() {
  const [selectedItem, setSelectedItem] = useState<string>('None');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dropdown Test Page</h1>
      <p className="mb-4">Selected: <strong>{selectedItem}</strong></p>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Basic Dropdown</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedItem('Profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedItem('Billing')}>
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedItem('Settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedItem('Logout')}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Aligned Right</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedItem('Edit')}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedItem('Duplicate')}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedItem('Delete')}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
