package com.MarineTrafficClone.SeaWatch.response;

import com.MarineTrafficClone.SeaWatch.enumeration.RoleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    private String token;
    private RoleType role;
}
