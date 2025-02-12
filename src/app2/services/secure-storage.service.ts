import { Injectable } from '@angular/core';
import forge from 'node-forge/lib';
import { RSA_PUBLIC_KEY } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  constructor() {}

  encrypt(data) {
    const publicKey = forge.pki.publicKeyFromPem(RSA_PUBLIC_KEY);
    const encryptedData = publicKey.encrypt(data);
    return forge.util.encode64(encryptedData);
  }
}
