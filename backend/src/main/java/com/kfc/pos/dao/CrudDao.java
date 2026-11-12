package com.kfc.pos.dao;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * GENERICS: one interface describes Create/Read/Update/Delete for any type T.
 *
 * CategoryDao implements CrudDao<Category>, ProductDao implements CrudDao<Product>,
 * and so on — the method names stay the same, only the type changes.
 */
public interface CrudDao<T> {

    List<T> findAll() throws SQLException;

    Optional<T> findById(int id) throws SQLException;

    /** Saves a new record and returns it with its generated id. */
    T create(T item) throws SQLException;

    void update(T item) throws SQLException;

    void delete(int id) throws SQLException;
}
