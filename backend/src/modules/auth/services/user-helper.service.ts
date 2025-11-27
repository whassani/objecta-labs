import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

/**
 * User Helper Service
 * 
 * Provides backward compatibility utilities for user name fields
 * as we migrate from firstName/lastName to fullName
 */
@Injectable()
export class UserHelperService {
  /**
   * Get fullName from firstName and lastName
   */
  getFullName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Parse fullName into firstName and lastName
   */
  parseFullName(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  }

  /**
   * Sanitize user object for API response
   */
  sanitizeUserResponse(user: User): Partial<User> {
    const { passwordHash, verificationToken, resetToken, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Prepare user data for database save
   * Converts fullName to firstName + lastName if needed
   */
  prepareUserForSave(userData: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    [key: string]: any;
  }): any {
    const prepared = { ...userData };

    // If fullName provided but not firstName/lastName, parse it
    if (prepared.fullName && (!prepared.firstName || !prepared.lastName)) {
      const { firstName, lastName } = this.parseFullName(prepared.fullName);
      prepared.firstName = firstName;
      prepared.lastName = lastName;
    }

    // Remove fullName from the data (not stored in DB)
    delete prepared.fullName;

    return prepared;
  }
}
