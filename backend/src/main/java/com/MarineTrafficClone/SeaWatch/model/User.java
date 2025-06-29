package com.MarineTrafficClone.SeaWatch.model;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false)
    @NotNull
    @Email
    private String email;

    @Column(name = "password")
    @NotBlank
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_type")
    private RoleType role;


    // This represents the user's single "fleet"
    @ManyToMany(fetch = FetchType.LAZY) // EAGER can cause performance issues if fleets are large
    @JoinTable(
            name = "fleet", // Name of the join table
            joinColumns = @JoinColumn(name = "user_id"),         // Foreign key for User in join table
            inverseJoinColumns = @JoinColumn(name = "ship_mmsi", referencedColumnName = "mmsi") // Foreign key for Ship, referencing Ship's mmsi column
    )
    private Set<Ship> fleet = new HashSet<>();

    /* ------------------------- METHODS ------------------------- */

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    // Helper methods to manage watchedShips
    public void addShipToFleet(Ship ship) {
        if (this.fleet == null) {
            this.fleet = new HashSet<>();
        }
        this.fleet.add(ship);
    }

    public void removeShipFromFleet(Ship ship) {
        if (this.fleet != null) {
            this.fleet.remove(ship);
        }
    }

    /* ------------------------- CONSTRUCTORS ------------------------- */

    public User(@NonNull String email, @NotBlank String password) {
        this.email = email;
        this.password = password;
    }
}
