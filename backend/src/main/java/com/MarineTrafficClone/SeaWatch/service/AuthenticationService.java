package com.MarineTrafficClone.SeaWatch.service;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import com.MarineTrafficClone.SeaWatch.model.UserEntity;
import com.MarineTrafficClone.SeaWatch.repository.UserEntityRepository;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserEntityRepository userEntityRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(AuthDTO AuthDTO) {
        var user = UserEntity.builder()
                .email(AuthDTO.getEmail())
                .password(passwordEncoder.encode(AuthDTO.getPassword()))
                .role(RoleType.REGISTERED)
                .build();

        userEntityRepository.save(user);

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .role(user.getRole())
                .build();
    }


    public AuthenticationResponse login(AuthDTO authDTO) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authDTO.getEmail(),
                        authDTO.getPassword()
                )
        );

        var user = userEntityRepository.findByEmail(authDTO.getEmail())
                .orElseThrow();

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .role(user.getRole())
                .build();
    }
}
