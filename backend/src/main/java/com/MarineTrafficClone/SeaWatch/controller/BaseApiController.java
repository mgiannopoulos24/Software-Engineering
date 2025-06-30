package com.MarineTrafficClone.SeaWatch.controller;

import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Μια βασική κλάση controller που ορίζει το κοινό prefix "/api"
 * για όλα τα API endpoints. Όλοι οι άλλοι REST controllers
 * πρέπει να κληρονομούν από αυτή την κλάση.
 */
@RequestMapping("/api")
public abstract class BaseApiController {
}
