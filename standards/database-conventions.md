# PostgreSQL Database Conventions

## 1. PostgreSQL Database Conventions

### 1.1 Tables

**Convention:** snake_case, PLURAL or SINGULAR form (configurable per project)

**EF Core Pluralization:** This standard supports both approaches:
- **Option A (Pluralization Enabled):** EF Core automatically pluralizes table names
- **Option B (Pluralization Disabled):** Manual control with singular names

**Example with Pluralization Enabled:**
```sql
-- ✅ CORRECT (Plural, snake_case)
CREATE TABLE products ( ... );              -- class: Product
CREATE TABLE customers ( ... );             -- class: Customer
CREATE TABLE order_items ( ... );           -- class: OrderItem
CREATE TABLE user_roles ( ... );            -- class: UserRole

-- ❌ INCORRECT
CREATE TABLE Products ( ... );              -- PascalCase
CREATE TABLE product ( ... );               -- Singular (if pluralization enabled)
CREATE TABLE product-items ( ... );         -- Hyphens not allowed
```

**Example with Pluralization Disabled:**
```sql
-- ✅ CORRECT (Singular, snake_case)
CREATE TABLE product ( ... );               -- class: Product
CREATE TABLE customer ( ... );              -- class: Customer
CREATE TABLE order_item ( ... );            -- class: OrderItem
CREATE TABLE user_role ( ... );             -- class: UserRole
```

**Key Identifiers:**
- **Primary Key (Guid):** Use `id` column name
- **Business Identifier (string):** Use `code` column name

```sql
-- ✅ CORRECT (with pluralization)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX uk_products_code ON products(code);
```

### 1.2 Columns

**Convention:** snake_case (mapped automatically from C# PascalCase properties)

```sql
-- ✅ CORRECT (snake_case, PostgreSQL standard)
CREATE TABLE products (
    id UUID PRIMARY KEY,                        -- PK
    code VARCHAR(50),                           -- Business identifier
    name VARCHAR(200),
    price DECIMAL(18,2),
    is_active BOOLEAN,                          -- Boolean flag
    created_at TIMESTAMP,                       -- Audit field
    created_by_user_id UUID REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by_user_id UUID REFERENCES users(id)
);

-- C# class with PascalCase (maps automatically)
public class Product
{
    public Guid ID { get; set; }                // → id
    public string Code { get; set; }            // → code
    public string Name { get; set; }            // → name
    public decimal Price { get; set; }          // → price
    public bool IsActive { get; set; }          // → is_active
    public DateTime CreatedAt { get; set; }     // → created_at
    public Guid CreatedByUserID { get; set; }   // → created_by_user_id
}

-- ❌ INCORRECT
CREATE TABLE products (
    ID UUID PRIMARY KEY,                        -- PascalCase
    Price DECIMAL(18,2),                        -- PascalCase
    IsActive BOOLEAN,                           -- PascalCase
    created-at TIMESTAMP,                       -- Hyphens not allowed
    Created_At TIMESTAMP                        -- Mixed case
);
```

**Acronym Columns:**
```sql
-- C# properties with acronyms
public string APIKey { get; set; }              // → api_key
public string HTTPEndpoint { get; set; }        // → http_endpoint
public string XMLContent { get; set; }          // → xml_content
public string JSONPayload { get; set; }         // → json_payload
public int HTTPStatusCode { get; set; }         // → http_status_code

-- PostgreSQL columns (snake_case)
CREATE TABLE api_configurations (
    id UUID PRIMARY KEY,
    api_key VARCHAR(100),
    http_endpoint VARCHAR(500),
    xml_content TEXT,
    json_payload JSONB,
    http_status_code INTEGER
);
```

### 1.3 Foreign Key Columns

**Convention:** C# uses `{EntityName}ID`, database uses `{entity_name}_id` (snake_case)

**Foreign Keys:**

Use the exact entity name + ID suffix in C#. Database columns are automatically converted to snake_case.

```sql
-- ✅ CORRECT - Specific entity references (snake_case in database)
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),      -- FK to customers table
    product_id UUID REFERENCES products(id),        -- FK to products table
    company_id UUID REFERENCES companies(id),       -- FK to companies table
    warehouse_id UUID REFERENCES warehouses(id)     -- FK to warehouses table
);

-- C# class (PascalCase properties → snake_case columns)
public class Order
{
    public Guid ID { get; set; }            // → id
    public Guid CustomerID { get; set; }    // → customer_id
    public Guid ProductID { get; set; }     // → product_id
    public Guid CompanyID { get; set; }     // → company_id
}
```

**Multiple References to Same Entity:**

When a table has multiple foreign keys to the same entity, use a context prefix to differentiate them.

**Pattern:** C# uses `{Context}{EntityName}ID`, database uses `{context}_{entity_name}_id`

```sql
-- ✅ CORRECT - Multiple FKs to same entity with context prefix
CREATE TABLE shipments (
    id UUID PRIMARY KEY,
    origin_warehouse_id UUID REFERENCES warehouses(id),      -- Origin warehouse
    destination_warehouse_id UUID REFERENCES warehouses(id), -- Destination warehouse
    shipped_at TIMESTAMP
);

CREATE TABLE transfers (
    id UUID PRIMARY KEY,
    source_account_id UUID REFERENCES accounts(id),      -- Source account
    destination_account_id UUID REFERENCES accounts(id), -- Destination account
    amount DECIMAL(18,2)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    sender_user_id UUID REFERENCES users(id),    -- Sender user
    receiver_user_id UUID REFERENCES users(id),  -- Receiver user
    amount DECIMAL(18,2)
);

-- C# classes
public class Shipment
{
    public Guid ID { get; set; }
    public Guid OriginWarehouseID { get; set; }        // → origin_warehouse_id
    public Guid DestinationWarehouseID { get; set; }   // → destination_warehouse_id
}

public class Transfer
{
    public Guid ID { get; set; }
    public Guid SourceAccountID { get; set; }          // → source_account_id
    public Guid DestinationAccountID { get; set; }     // → destination_account_id
}
```

**Common Context Prefixes:**
- `Origin` / `Destination` - Origin and destination locations
- `Source` / `Destination` - Source and destination entities
- `Sender` / `Receiver` - Sender and receiver in transactions
- `Parent` / `Child` - Hierarchical relationships
- `Primary` / `Secondary` - Primary and secondary references
- `Manager` / `Subordinate` - Management relationships

**Audit Foreign Keys:**

For audit fields that reference Users, use `{Action}ByUserID` pattern in C#:

```sql
-- ✅ CORRECT - Explicit User references with action context (snake_case in database)
CREATE TABLE products (
    id UUID PRIMARY KEY,
    code VARCHAR(50),
    name VARCHAR(200),
    created_by_user_id UUID REFERENCES users(id),   -- Who created
    updated_by_user_id UUID REFERENCES users(id),   -- Who last updated
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- C# class
public class Product
{
    public Guid ID { get; set; }                    // → id
    public string Code { get; set; }                // → code
    public string Name { get; set; }                // → name
    public Guid CreatedByUserID { get; set; }       // → created_by_user_id
    public Guid? UpdatedByUserID { get; set; }      // → updated_by_user_id
    public DateTime CreatedAt { get; set; }         // → created_at
    public DateTime? UpdatedAt { get; set; }        // → updated_at
}
```

**Rationale:**
- C# `ProductID` is clearer than `ID` (ID of what?)
- C# `CreatedByUserID` is clearer than `CreatedBy` (created by what entity?)
- Database `product_id` follows PostgreSQL convention (snake_case)
- Self-documenting: no need to check FK constraints to understand relationships
- Consistent pattern: `{EntityName}ID` in C# → `{entity_name}_id` in database

```sql
-- ❌ INCORRECT - Generic or ambiguous names
CreatedBy UUID                      -- By what entity? Users? Systems?
product_id UUID                     -- C# side (should be ProductID in PascalCase)
Product_ID UUID                     -- Mixed case
PRODUCTID UUID                      -- All caps
ProductId UUID                      -- camelCase suffix (prefer ID)
```

### 1.4 Indexes

**Convention:** `ix_{table}_{column(s)}` or `uk_{table}_{column(s)}` (for unique) in snake_case

```sql
-- ✅ CORRECT (all snake_case)
CREATE INDEX ix_products_code ON products(code);
CREATE INDEX ix_products_name ON products(name);
CREATE INDEX ix_products_is_active ON products(is_active);
CREATE INDEX ix_orders_customer_id ON orders(customer_id);
CREATE INDEX ix_user_roles_user_id ON user_roles(user_id);

-- For multi-column indexes
CREATE INDEX ix_orders_customer_id_created_at ON orders(customer_id, created_at);

-- For unique indexes, use uk_ prefix
CREATE UNIQUE INDEX uk_products_code ON products(code);
CREATE UNIQUE INDEX uk_customers_email ON customers(email);

-- ❌ INCORRECT
CREATE INDEX ProductCodeIndex ON products(code);        -- PascalCase
CREATE INDEX idx_Products_Code ON products(code);       -- Mixed case
CREATE INDEX idx_orders_CustomerID ON orders(customer_id);  -- PascalCase column
```

### 1.5 Constraints

**Convention:** `{type}_{table}_{column(s)}` in snake_case

```sql
-- Primary Key
CONSTRAINT pk_products PRIMARY KEY (id)

-- Foreign Key
CONSTRAINT fk_orders_customers FOREIGN KEY (customer_id) REFERENCES customers(id)
CONSTRAINT fk_orders_products FOREIGN KEY (product_id) REFERENCES products(id)

-- Unique
CONSTRAINT uk_products_code UNIQUE (code)
CONSTRAINT uk_customers_email UNIQUE (email)

-- Check
CONSTRAINT chk_products_price_positive CHECK (price > 0)
CONSTRAINT chk_orders_quantity_positive CHECK (quantity > 0)
```

### 1.6 PostgreSQL Schemas

**Convention:** lowercase with underscores (snake_case)

```sql
-- ✅ CORRECT
CREATE SCHEMA authentication;
CREATE SCHEMA inventory;
CREATE SCHEMA sales;
CREATE SCHEMA accounting;
CREATE SCHEMA product_management;

-- ❌ INCORRECT
CREATE SCHEMA Authentication;           -- PascalCase
CREATE SCHEMA ProductManagement;        -- PascalCase
CREATE SCHEMA "product-management";     -- Hyphenated (prefer underscores)
```

**Schema-to-Service Mapping Example:**

| Microservice | Schema Name | Purpose |
|--------------|-------------|---------|
| AuthenticationService | `authentication` | Users, Roles, Permissions |
| InventoryService | `inventory` | Products, Warehouses, Stock |
| SalesService | `sales` | Customers, Orders, Invoices |
| AccountingService | `accounting` | Accounts, Ledgers, Transactions |

**EF Core Configuration:**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Set default schema for all entities in this context
    modelBuilder.HasDefaultSchema("inventory");

    // Configure specific entity table names
    modelBuilder.Entity<Product>(entity =>
    {
        entity.ToTable("products", "inventory");
    });

    // Apply snake_case naming to all entities
    modelBuilder.ApplySnakeCaseNaming();
}
```

### 1.7 Projection Tables (Cross-Service References)

**Convention:** C# class `{PREFIX}_{Entity}Prj`, database table `{prefix}_{origin_table_name}_prj` (snake_case)

**Purpose:** Tables that maintain eventual-consistent copies of data from other microservices for referential integrity without database-level foreign keys.

**Pattern:**
```
Prefix:       4 uppercase characters identifying the source service/module
C# Class:     {PREFIX}_{Entity}Prj (singular - class convention)
Database:     {prefix}_{origin_table_name}_prj (maintains origin table plurality)
```

**Rule:** The projection table name must maintain the same plurality (singular/plural) as the origin table it projects from.

**Prefix Examples:**
- `AUTH` - Authentication service
- `INVT` - Inventory service
- `SALE` - Sales service
- `ACCT` - Accounting service
- `PROD` - Product management service

**Examples:**

| Origin Table | Origin Schema | C# Class | Database Projection | Consumer Schema | Purpose |
|--------------|---------------|----------|---------------------|-----------------|---------|
| users | authentication | **AUTH_UserPrj** | **auth_users_prj** | accounting | Audit fields (created_by_user_id) |
| users | authentication | **AUTH_UserPrj** | **auth_users_prj** | inventory | Audit fields (created_by_user_id) |
| products | inventory | **INVT_ProductPrj** | **invt_products_prj** | sales | Product references (product_id) |
| customers | sales | **SALE_CustomerPrj** | **sale_customers_prj** | accounting | Customer references (customer_id) |
| accounts | accounting | **ACCT_AccountPrj** | **acct_accounts_prj** | sales | Account references (account_id) |

**SQL Schema Template:**

```sql
-- ✅ CORRECT: Projection table in consumer schema (snake_case with prefix, maintains origin plurality)
-- Schema: inventory (consuming users from authentication service)
-- Origin: users (plural) → Projection: auth_users_prj (plural)
CREATE TABLE auth_users_prj (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL,
    last_synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_auth_users_prj_code ON auth_users_prj(code);
CREATE INDEX ix_auth_users_prj_is_active ON auth_users_prj(is_active);

-- Schema: sales (consuming products from inventory service)
-- Origin: products (plural) → Projection: invt_products_prj (plural)
CREATE TABLE invt_products_prj (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(18,2),
    is_active BOOLEAN NOT NULL,
    last_synced_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ❌ INCORRECT: Old naming conventions
CREATE TABLE UsersPrj (...);                -- PascalCase (wrong)
CREATE TABLE user_projection (...);         -- Too verbose (wrong)
CREATE TABLE users_prj (...);               -- Missing prefix (wrong)
CREATE TABLE auth_user_prj (...);           -- Wrong plurality (origin is plural 'users')
CREATE TABLE AUTH_UsersPrj (...);           -- PascalCase in DB (wrong)
CREATE TABLE authUserPrj (...);             -- camelCase (wrong)
```

**C# Entity Example:**

```csharp
// ✅ CORRECT: C# class uses PREFIX_EntityPrj pattern
public class AUTH_UserPrj
{
    public Guid ID { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime LastSyncedAt { get; set; }
}

public class INVT_ProductPrj
{
    public Guid ID { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public DateTime LastSyncedAt { get; set; }
}

// DbContext with explicit table mapping
public DbSet<AUTH_UserPrj> AUTH_UserPrj => Set<AUTH_UserPrj>();
public DbSet<INVT_ProductPrj> INVT_ProductPrj => Set<INVT_ProductPrj>();

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<AUTH_UserPrj>(entity =>
    {
        // Table name maintains origin table plurality (users → auth_users_prj)
        entity.ToTable("auth_users_prj", "inventory");
        // Column mappings applied automatically via SnakeCaseNamingConvention
    });

    modelBuilder.Entity<INVT_ProductPrj>(entity =>
    {
        // Table name maintains origin table plurality (products → invt_products_prj)
        entity.ToTable("invt_products_prj", "sales");
    });
}
```

**Synchronization:**
- Via domain events (message bus): `UserCreated`, `UserUpdated`, `ProductUpdated`
- Eventual consistency model
- No database-level FK constraints
- Application-level validation before insert

**Usage in Business Tables:**

```sql
-- Business table references projection (no FK constraint)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    customer_id UUID NOT NULL,                  -- References sale_customers_prj.id (no FK)
    created_by_user_id UUID NOT NULL,           -- References auth_users_prj.id (no FK)
    amount DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Validation in application layer before insert:
-- 1. Check sale_customers_prj
-- 2. Check auth_users_prj
-- 3. Then insert order
```

**Rationale:**
- **4-char prefix:** Identifies source service/module clearly (`AUTH`, `INVT`, `SALE`, `ACCT`)
- **`Prj` suffix in C#:** Short (3 chars), recognizable abbreviation for "Projection"
- **Brevity over verbosity:** `AUTH_UserPrj` preferred over `AuthenticationUserProjection`
- **snake_case in database:** Consistent with PostgreSQL standard
- **Maintains origin plurality:** `users` → `auth_users_prj`, `products` → `invt_products_prj` (clear relationship to origin)
- **Direct mapping:** Visual consistency between origin and projection (`users` ↔ `auth_users_prj`)
- **Self-documenting:** Clear distinction from origin table via prefix + `_prj` suffix
- **Namespace isolation:** Prefix prevents naming collisions across services
- **Query clarity:** Queries clearly show which origin table is being referenced

**Plurality Examples:**

```csharp
// With Pluralization Enabled (origin tables are plural)
Origin: users (plural) → Projection: auth_users_prj (plural)
Origin: products (plural) → Projection: invt_products_prj (plural)
Origin: categories (plural) → Projection: acct_categories_prj (plural)

// With Pluralization Disabled (origin tables are singular)
Origin: user (singular) → Projection: auth_user_prj (singular)
Origin: product (singular) → Projection: invt_product_prj (singular)
Origin: category (singular) → Projection: acct_category_prj (singular)
```

**Key Principle:** Always mirror the origin table's plurality in the projection table name for maximum clarity and consistency.

## 2. EF Core Mapping Strategy

### 2.1 Strategy: Automatic snake_case Conversion

**Decision:** C# classes use idiomatic PascalCase, PostgreSQL uses idiomatic snake_case. EF Core automatically converts between them via `SnakeCaseNamingConvention`.

**Benefits:**
- ✅ Idiomatic C# code (PascalCase properties)
- ✅ PostgreSQL standard naming (snake_case columns)
- ✅ Zero manual `[Column]` or `[Table]` attributes needed
- ✅ Handles acronyms correctly (APIKey → api_key, HTTPClient → http_client)
- ✅ Single source of truth (C# classes define structure)

**Implementation:**

```csharp
// File: Shared/EntityFramework/SnakeCaseNamingConvention.cs
public static class SnakeCaseNamingConvention
{
    public static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        // Handle acronyms and PascalCase correctly:
        // ID → id, APIKey → api_key, CreatedAt → created_at, HTTPClient → http_client
        var snakeCase = Regex.Replace(input, "([a-z0-9])([A-Z])", "$1_$2");
        snakeCase = Regex.Replace(snakeCase, "([A-Z]+)([A-Z][a-z])", "$1_$2");
        return snakeCase.ToLowerInvariant();
    }

    public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder)
    {
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Convert table names: Product → product (or products if pluralization enabled)
            entity.SetTableName(ToSnakeCase(entity.GetTableName()));

            // Convert column names: CreatedAt → created_at
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }

            // Convert indexes: ix_Product_Code → ix_product_code
            foreach (var index in entity.GetIndexes())
            {
                var prefix = index.IsUnique ? "uk_" : "ix_";
                var tableName = ToSnakeCase(entity.GetTableName());
                var columnNames = string.Join("_", index.Properties.Select(p => ToSnakeCase(p.Name)));
                index.SetDatabaseName($"{prefix}{tableName}_{columnNames}");
            }

            // Convert FK constraints: fk_Order_Customer → fk_order_customer
            foreach (var foreignKey in entity.GetForeignKeys())
            {
                var dependentTable = ToSnakeCase(foreignKey.DeclaringEntityType.GetTableName());
                var principalTable = ToSnakeCase(foreignKey.PrincipalEntityType.GetTableName());
                foreignKey.SetConstraintName($"fk_{dependentTable}_{principalTable}");
            }
        }
    }
}
```

**Example Mapping:**

```csharp
// C# Entity (idiomatic PascalCase)
public class Product
{
    public Guid ID { get; set; }                // → id
    public string Code { get; set; }            // → code
    public string Name { get; set; }            // → name
    public decimal Price { get; set; }          // → price
    public bool IsActive { get; set; }          // → is_active
    public DateTime CreatedAt { get; set; }     // → created_at
    public Guid CreatedByUserID { get; set; }   // → created_by_user_id
    public string APIKey { get; set; }          // → api_key
    public string HTTPEndpoint { get; set; }    // → http_endpoint
}

// PostgreSQL Table (PostgreSQL standard snake_case) - GENERATED AUTOMATICALLY
CREATE TABLE products (  -- or 'product' if pluralization disabled
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(18,2) NOT NULL,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  api_key VARCHAR(100),
  http_endpoint VARCHAR(500)
);

CREATE UNIQUE INDEX uk_products_code ON products(code);
CREATE INDEX ix_products_is_active ON products(is_active);
```

### 2.2 DbContext Configuration

**CRITICAL:** Apply snake_case naming **AFTER** all entity configurations:

```csharp
// Example DbContext
public class ApplicationDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Set schema
        modelBuilder.HasDefaultSchema("inventory");

        // Configure entities (explicit table naming)
        modelBuilder.Entity<Product>(entity =>
        {
            // Explicit snake_case table name
            // Use "products" if pluralization enabled, "product" if disabled
            entity.ToTable("products", "inventory");

            entity.HasKey(e => e.ID);

            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Code).IsUnique();

            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        // CRITICAL: Apply snake_case naming LAST
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**Why apply last?** The convention needs to process all configured entities, indexes, and constraints.

### 2.3 When to Use [Column] or [Table] Attributes

**Short answer: RARELY**

The `SnakeCaseNamingConvention` handles all mapping automatically. Manual attributes are:
- ❌ Usually not needed
- ❌ Can create inconsistency
- ❌ Bypass the convention
- ❌ Increase maintenance burden

```csharp
// ❌ INCORRECT - Don't use manual attributes (convention handles this)
public class Product
{
    [Column("price")]  // WRONG - convention handles this
    public decimal Price { get; set; }

    [Table("products")]  // WRONG - use ToTable() in OnModelCreating instead
}

// ✅ CORRECT - Let convention handle everything
public class Product
{
    public decimal Price { get; set; }  // → price automatically
}
```

**Exception:** If you legitimately need a database column name that doesn't follow snake_case (e.g., legacy integration), document it clearly and use `[Column]` with a comment explaining why.

## 3. Tooling

### 3.1 SQL - pg_format

```bash
# Format SQL files with snake_case
pg_format --function-case 2 --keyword-case 2 --spaces 2 migration.sql
```
