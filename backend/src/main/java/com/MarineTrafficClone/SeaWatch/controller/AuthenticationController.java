package com.MarineTrafficClone.SeaWatch.controller;

import com.MarineTrafficClone.SeaWatch.dto.AuthDTO;
import com.MarineTrafficClone.SeaWatch.response.AuthenticationResponse;
import com.MarineTrafficClone.SeaWatch.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> registerUser(@RequestBody AuthDTO authDTO) {
        return ResponseEntity.ok(authenticationService.register(authDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticateUser(@RequestBody AuthDTO authDTO) {
        return ResponseEntity.ok(authenticationService.login(authDTO));
    }
}
