package com.kfc.pos.model;

public class Cashier extends Employee {
    public Cashier(int id, String firstName, String lastName, String username,
                   String passwordHash, boolean active) {
        super(id, firstName, lastName, username, passwordHash, active);
    }

    @Override
    public String getRole() { return "CASHIER"; }

    @Override
    public boolean canManageProducts() { return false; }

    @Override
    public boolean canManageInventory() { return false; }

    @Override
    public boolean canManageEmployees() { return false; }
}
