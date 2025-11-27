# Admin User Management - Quick Start Guide

## 🚀 Quick Start

### Prerequisites
- You must be logged in as a **super_admin**
- Backend server running on `http://localhost:3001`
- Frontend server running on `http://localhost:3000`

## 📋 Access the Admin Panel

1. Navigate to: `http://localhost:3000/admin/login`
2. Login with super_admin credentials
3. Go to **Users** page from the sidebar

## 🎯 Common Tasks

### 1️⃣ Create a New Organization

**When to use**: Setting up a new customer company

**Steps**:
1. Click **"Create Organization"** button (top right)
2. Enter organization name (e.g., "Acme Corporation")
3. Subdomain auto-generates (e.g., "acme") - edit if needed
4. Select plan: Starter, Professional, or Enterprise
5. Click **"Create Organization"**

**Result**: New organization with 14-day trial period

---

### 2️⃣ Create a Customer User

**When to use**: Adding a user to an existing organization

**Steps**:
1. Click **"Create User"** button (top right)
2. Select **"Customer User"** radio button (default)
3. Fill in user details:
   - First Name & Last Name
   - Email address
   - Password (or click "Generate")
4. Select **Organization** from dropdown
5. Choose **User Role**: Member, Admin, Editor, or Viewer
6. (Optional) Check **"Grant Platform Admin Access"** if they need admin panel access
7. Click **"Create User"**

**Result**: User added to the selected organization

---

### 3️⃣ Create a Platform Team Member

**When to use**: Adding internal staff (support, admin, developers)

**Steps**:
1. Click **"Create User"** button (top right)
2. Select **"Platform Team"** radio button
3. Fill in user details:
   - First Name & Last Name
   - Email address (use company domain)
   - Password (or click "Generate")
4. Choose **User Role**: Member (default)
5. **Important**: Check **"Grant Platform Admin Access"**
6. Select **Admin Role**:
   - **Super Admin**: Full access to everything
   - **Admin**: Most features, limited settings
   - **Support**: Support tickets only
7. Click **"Create User"**

**Result**: Internal team member created (not tied to any organization)

---

### 4️⃣ Filter Users

**Use the filter tabs to view different user groups**:

- **All Users**: See everyone in the system
- **Customer Users**: Only users belonging to organizations
- **Platform Team**: Only internal team members

**Search**: Use the search bar to find users by name or email

---

### 5️⃣ Manage Existing Users

**Click the ⋮ (three dots) menu on any user row to**:

- ✏️ **Edit User**: Update user details
- 🔑 **Reset Password**: Change user password
- 🚫 **Suspend User**: Temporarily disable account
- ✅ **Activate User**: Re-enable suspended account
- 🗑️ **Delete User**: Permanently remove user (careful!)

---

## 🔍 Understanding User Types

### Customer User
```
✓ Belongs to an organization
✓ Can access their organization's data
✓ Can optionally have admin panel access
✓ Shown in "Customer Users" filter
✓ Organization name displayed in table
```

### Platform Team
```
✓ Does not belong to any organization
✓ Always has admin panel access
✓ Can manage the entire platform
✓ Shown in "Platform Team" filter
✓ Shows "Platform Team" badge in table
```

---

## 🎨 Visual Indicators

### In the User Table

| Indicator | Meaning |
|-----------|---------|
| 🟢 **[Active]** | User account is active |
| 🔴 **[Inactive]** | User account is suspended |
| 🟣 **[super_admin]** | User has super admin role |
| 🟣 **[admin]** | User has admin role |
| 🟣 **[support]** | User has support role |
| 🔵 **[Platform Team]** | Internal team member (no organization) |

---

## ⚠️ Important Notes

### Permissions
- Only **super_admin** can create organizations
- Only **super_admin** can create users
- Regular admins can view but not create

### Email Uniqueness
- Each email must be unique across the entire platform
- You'll get an error if the email already exists

### Subdomain Uniqueness
- Each subdomain must be unique
- Only lowercase letters, numbers, and hyphens allowed
- Shown as: `subdomain.yourdomain.com`

### Organization Requirements
- **Customer users** MUST have an organization
- **Platform team** MUST NOT have an organization

### Trial Period
- New organizations automatically get 14-day trial
- Plan can be changed later from customer details

---

## 🐛 Troubleshooting

### "Email already exists"
**Problem**: Another user already has this email
**Solution**: Use a different email or check existing users

### "Subdomain already exists"
**Problem**: Another organization already uses this subdomain
**Solution**: Choose a different subdomain

### "Organization is required for customer users"
**Problem**: Trying to create customer user without selecting organization
**Solution**: Select an organization or change to "Platform Team"

### "Only super admins can create users"
**Problem**: Logged in as regular admin
**Solution**: Login as super_admin

### User not showing in filter
**Problem**: Wrong filter selected
**Solution**: 
- Customer users → Use "Customer Users" filter
- Platform team → Use "Platform Team" filter

---

## 📊 Example Scenarios

### Scenario 1: New Customer Onboarding
```
1. Create Organization: "Acme Corporation" (subdomain: "acme")
2. Create User: john@acme.com (Customer User, Admin role)
3. User can now login and invite team members
```

### Scenario 2: Adding Support Team Member
```
1. Create User: sarah@yourcompany.com (Platform Team, Support role)
2. Sarah can now access admin panel and manage support tickets
3. Sarah won't see customer organization data
```

### Scenario 3: Adding Super Admin
```
1. Create User: admin@yourcompany.com (Platform Team, Super Admin)
2. Admin can manage entire platform, all customers, all users
3. Admin appears in "Platform Team" filter
```

---

## 🎓 Best Practices

### Organization Naming
- ✅ Use company legal name: "Acme Corporation"
- ❌ Don't use: "acme", "ACME", "acme-corp"

### Subdomain Naming
- ✅ Use: "acme", "acme-corp", "acme-inc"
- ❌ Don't use: "Acme", "ACME_Corp", "acme corp"

### Email Conventions
- ✅ Customer users: Use customer's domain (john@acme.com)
- ✅ Platform team: Use your company domain (admin@yourplatform.com)

### Role Assignment
- **Customer Admin**: Manages their organization
- **Platform Support**: Handles support tickets only
- **Platform Admin**: Manages platform features
- **Super Admin**: Full platform control (limit this!)

### Password Management
- Use the "Generate" button for strong passwords
- Copy password before creating user
- Share securely with the new user
- Encourage users to change on first login

---

## 📞 Need Help?

### Common Questions

**Q: Can I change a customer user to platform team?**
A: Yes, edit the user and change their organization to null (requires backend)

**Q: Can a platform team member belong to an organization?**
A: No, platform team members don't belong to organizations

**Q: How do I create bulk users?**
A: Use the API endpoints with a script (see API documentation)

**Q: Can I delete an organization?**
A: Yes, but all users must be moved or deleted first

**Q: What happens to deleted users?**
A: They are permanently removed (cannot be undone)

---

## 🔗 Related Documentation

- [Complete Feature Guide](./ADMIN-USER-MANAGEMENT-REFACTOR.md)
- [Visual Guide](./ADMIN-USER-MANAGEMENT-VISUAL-GUIDE.md)
- [API Documentation](./docs/API-REFERENCE.md)
- [Testing Guide](./test-admin-user-management.sh)

---

## ✅ Checklist for New Super Admins

Before creating users, make sure you:
- [ ] Understand the difference between customer users and platform team
- [ ] Have created the organization (if creating customer users)
- [ ] Know which admin role to assign
- [ ] Have a secure password ready
- [ ] Know the user's email address
- [ ] Understand the organization's plan and trial period

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Ready for Use
