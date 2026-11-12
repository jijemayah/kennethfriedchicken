package com.kfc.pos.model;

/** ENCAPSULATION: phone and e-mail are format-checked with regex in the setters. */
public class Customer {

    private int id;
    private String fullName;
    private String phone;
    private String email;

    public Customer(int id, String fullName, String phone, String email) {
        this.id = id;
        setFullName(fullName);
        setPhone(phone);
        setEmail(email);
    }

    public int getId() { return id; }

    public void setId(int id) { this.id = id; }

    public String getFullName() { return fullName; }

    public void setFullName(String fullName) {
        this.fullName = Validator.requireText(fullName, "Customer name", 120);
    }

    public String getPhone() { return phone; }

    public void setPhone(String phone) {
        String value = Validator.optionalText(phone, 15);
        if (value != null && !Validator.PH_MOBILE.matcher(value).matches()) {
            throw new IllegalArgumentException("Phone must look like 09171234567");
        }
        this.phone = value;
    }

    public String getEmail() { return email; }

    public void setEmail(String email) {
        String value = Validator.optionalText(email, 120);
        if (value != null && !Validator.EMAIL.matcher(value).matches()) {
            throw new IllegalArgumentException("E-mail address is not valid");
        }
        this.email = value;
    }
}
