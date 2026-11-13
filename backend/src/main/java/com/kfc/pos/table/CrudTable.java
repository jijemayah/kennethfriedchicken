package com.kfc.pos.table;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public interface CrudTable<T> {
    List<T> findAll() throws SQLException;

    Optional<T> findById(int id) throws SQLException;

    T create(T item) throws SQLException;

    void update(T item) throws SQLException;

    void delete(int id) throws SQLException;
}
