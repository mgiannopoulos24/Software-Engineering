package com.MarineTrafficClone.SeaWatch.exception;

public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String message) {
    super(message);
  }

  // Μπορεί να το χρειαστώ
//  public ResourceNotFoundException(String message, Throwable cause) {
//    super(message, cause);
//  }
}
