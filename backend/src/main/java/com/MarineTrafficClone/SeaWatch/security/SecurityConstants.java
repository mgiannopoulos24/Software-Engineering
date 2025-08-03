package com.MarineTrafficClone.SeaWatch.security;

/**
 * Κλάση που περιέχει σταθερές (constants) που χρησιμοποιούνται
 * σε διάφορα μέρη της υλοποίησης ασφαλείας με JWT.
 */
public class SecurityConstants {
    /**
     * Το πρόθεμα που χρησιμοποιείται στο Authorization header πριν το JWT.
     * (π.χ., "Authorization: Bearer <token>")
     */
    public static final String TOKEN_PREFIX = "Bearer ";

    /** Το όνομα του HTTP header που περιέχει το token. */
    public static final String HEADER_STRING = "Authorization";

    /**
     * Ο χρόνος λήξης των tokens σε χιλιοστά του δευτερολέπτου.
     * 86,400,000 ms = 24 ώρες.
     */
    public static final long EXPIRATION_TIME = 86_400_000;  // 1 day
}