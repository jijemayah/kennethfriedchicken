package com.kfc.pos.model;

public class Manager extends Employee {
    public Manager(int id, String firstName, String lastName, String username,
                   String passwordHash, boolean active) {
        super(id, firstName, lastName, username, passwordHash, active);
    }

    @Override
    public String getRole() { return "MANAGER"; }

    @Override
    public boolean canManageProducts() { return isActive(); }

    @Override
    public boolean canManageInventory() { return isActive(); }

    @Override
    public boolean canManageEmployees() { return isActive(); }
}
