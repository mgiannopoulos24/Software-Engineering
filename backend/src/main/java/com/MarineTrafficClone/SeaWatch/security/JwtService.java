package com.MarineTrafficClone.SeaWatch.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service υπεύθυνο για όλες τις λειτουργίες που σχετίζονται με τα JSON Web Tokens (JWT).
 * Περιλαμβάνει τη δημιουργία (generation), την εξαγωγή πληροφοριών (parsing/extraction)
 * και την επικύρωση (validation) των tokens.
 */
@Service
public class JwtService {

    private final SecretKey jwtSecretKey;


    // 2. Τροποποιούμε τον constructor για να κάνει inject την τιμή από το application.properties.
    public JwtService(@Value("${jwt.secret-key}") String secretKey) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.jwtSecretKey = Keys.hmacShaKeyFor(keyBytes);
    }
    
    /**
     * Εξάγει το username (στην περίπτωσή μας, το email) από ένα JWT token.
     * @param token Το JWT token.
     * @return Το username (email).
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Γενική μέθοδος για την εξαγωγή ενός συγκεκριμένου "claim" (πληροφορίας) από το token.
     * @param token Το JWT token.
     * @param claimsResolver Μια συνάρτηση που ορίζει ποιο claim θα εξαχθεί.
     * @param <T> Ο τύπος του claim.
     * @return Το εξαγόμενο claim.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Δημιουργεί ένα νέο JWT token για έναν συγκεκριμένο χρήστη.
     * @param userDetails Τα στοιχεία του χρήστη (από το Spring Security).
     * @return Το JWT token ως String.
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Δημιουργεί ένα νέο JWT token με επιπλέον claims.
     * @param extraClaims Ένα Map με επιπλέον πληροφορίες που θέλουμε να προσθέσουμε στο token.
     * @param userDetails Τα στοιχεία του χρήστη.
     * @return Το JWT token ως String.
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .claims(extraClaims) // Προσθήκη των επιπλέον claims.
                .subject(userDetails.getUsername()) // Ορισμός του "subject" του token (το username).
                .issuedAt(new Date(System.currentTimeMillis())) // Χρόνος έκδοσης.
                .expiration(new Date(System.currentTimeMillis() + SecurityConstants.EXPIRATION_TIME)) // Χρόνος λήξης.
                .signWith(this.jwtSecretKey, Jwts.SIG.HS256) // Υπογραφή του token με το μυστικό κλειδί και τον αλγόριθμο HS256.
                .compact(); // Δημιουργία της τελικής String αναπαράστασης.
    }

    /**
     * Ελέγχει αν ένα token είναι έγκυρο για έναν συγκεκριμένο χρήστη.
     * @param token Το JWT token.
     * @param userDetails Τα στοιχεία του χρήστη.
     * @return true αν το token ανήκει στον χρήστη και δεν έχει λήξει, αλλιώς false.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Ελέγχει αν ένα token έχει λήξει.
     * @param token Το JWT token.
     * @return true αν έχει λήξει, αλλιώς false.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Εξάγει την ημερομηνία λήξης από το token.
     * @param token Το JWT token.
     * @return Η ημερομηνία λήξης.
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Αναλύει το token και εξάγει όλα τα claims του.
     * @param token Το JWT token.
     * @return Ένα αντικείμενο Claims που περιέχει όλες τις πληροφορίες.
     */
    private Claims extractAllClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(this.jwtSecretKey) // Επαλήθευση της υπογραφής με το μυστικό κλειδί.
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

}