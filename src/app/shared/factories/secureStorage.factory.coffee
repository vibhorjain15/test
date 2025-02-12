angular.module('diligenceVault').factory 'SecureStorageFactory', ($injector,PASSKEYS) ->
  new class SecureStorageFactory
    encrypt:(data) ->
      publicKey = forge.pki.publicKeyFromPem(PASSKEYS.RSA_PUBLIC_KEY);
      encryptedData = publicKey.encrypt(data);
      forge.util.encode64(encryptedData);
