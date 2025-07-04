package com.MarineTrafficClone.SeaWatch.security;

/**
 * Κλάση που περιέχει σταθερές (constants) που χρησιμοποιούνται
 * σε διάφορα μέρη της υλοποίησης ασφαλείας με JWT.
 */
public class SecurityConstants {
    /**
     * Το μυστικό κλειδί που χρησιμοποιείται για την υπογραφή των JWT.
     * Σε ένα πραγματικό περιβάλλον παραγωγής, αυτό θα πρέπει να είναι πολύ πιο πολύπλοκο
     * και να φορτώνεται από ένα ασφαλές μέρος (π.χ., environment variables, vault),
     * όχι να είναι hardcoded. Αλλά για την εργασία το αφήσαμε εδώ για απλότητα.
     */
    public static final String SECRET_KEY = "65A0095E064188ED29E42BB343B98EB0BDDFF0EC5CCE59F55E9FFCC8D2C02581";

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