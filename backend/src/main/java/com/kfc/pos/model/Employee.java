package com.kfc.pos.model;

public abstract class Employee {
    private int id;
    private String firstName;
    private String lastName;
    private String username;
    private String passwordHash;
    private boolean active;

    protected Employee(int id, String firstName, String lastName, String username,
                       String passwordHash, boolean active) {
        this.id = id;
        setFirstName(firstName);
        setLastName(lastName);
        setUsername(username);
        this.passwordHash = passwordHash;
        this.active = active;
    }

    public abstract String getRole();

    public abstract boolean canManageProducts();

    public abstract boolean canManageInventory();

    public abstract boolean canManageEmployees();

    public boolean canProcessSales() {
        return active;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    public String getFirstName() { return firstName; }

    public void setFirstName(String firstName) {
        this.firstName = Validator.requireText(firstName, "First name", 60);
    }

    public String getLastName() { return lastName; }

    public void setLastName(String lastName) {
        this.lastName = Validator.requireText(lastName, "Last name", 60);
    }

    public String getUsername() { return username; }

    public void setUsername(String username) {
        this.username = Validator.requireUsername(username);
    }

    public String getPasswordHash() { return passwordHash; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isActive() { return active; }

    public void setActive(boolean active) { this.active = active; }

    public static Employee create(String role, int id, String firstName, String lastName,
                                  String username, String passwordHash, boolean active) {
        if ("MANAGER".equalsIgnoreCase(role)) {
            return new Manager(id, firstName, lastName, username, passwordHash, active);
        }
        if ("CASHIER".equalsIgnoreCase(role)) {
            return new Cashier(id, firstName, lastName, username, passwordHash, active);
        }
        throw new IllegalArgumentException("Role must be CASHIER or MANAGER");
    }
}
