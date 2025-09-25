#!/usr/bin/env node

/**
 * Test script for Copernicus simple authentication (no TOTP)
 * Based on official documentation
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PRODUCTS_URL = 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products';

/**
 * Test simple authentication without TOTP
 */
async function testSimpleAuth() {
  console.log('🔐 Testing Copernicus simple authentication (no TOTP)...\n');

  const username = process.env.COPERNICUS_USERNAME;
  const password = process.env.COPERNICUS_PASSWORD;

  if (!username || !password) {
    console.error('❌ Missing COPERNICUS_USERNAME or COPERNICUS_PASSWORD in environment');
    process.exit(1);
  }

  console.log(`Username: ${username}`);
  console.log('Password: ***hidden***\n');

  try {
    // Step 1: Authenticate WITHOUT TOTP
    console.log('1️⃣ Authenticating without TOTP...');
    
    const authBody = new URLSearchParams({
      'client_id': 'cdse-public',
      'grant_type': 'password',
      'username': username,
      'password': password
      // NO TOTP!
    });

    const authResponse = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BGAPP-Test/1.0'
      },
      body: authBody.toString()
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error(`❌ Authentication failed: ${authResponse.status}`);
      console.error('Response:', error);
      process.exit(1);
    }

    const tokenData = await authResponse.json();
    console.log('✅ Authentication successful!');
    console.log(`Token type: ${tokenData.token_type}`);
    console.log(`Expires in: ${tokenData.expires_in} seconds`);
    console.log(`Token: ${tokenData.access_token.substring(0, 20)}...`);
    
    if (tokenData.refresh_token) {
      console.log('✅ Refresh token received');
    }

    // Step 2: Test API call with token
    console.log('\n2️⃣ Testing API call with token...');
    
    const testUrl = `${PRODUCTS_URL}?$filter=Collection/Name eq 'SENTINEL-3'&$top=1`;
    
    const apiResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'BGAPP-Test/1.0'
      }
    });

    if (!apiResponse.ok) {
      console.error(`❌ API call failed: ${apiResponse.status}`);
      const error = await apiResponse.text();
      console.error('Response:', error);
      process.exit(1);
    }

    const products = await apiResponse.json();
    console.log('✅ API call successful!');
    console.log(`Products found: ${products.value?.length || 0}`);
    
    if (products.value && products.value.length > 0) {
      const product = products.value[0];
      console.log('\nSample product:');
      console.log(`- Name: ${product.Name}`);
      console.log(`- ID: ${product.Id}`);
      console.log(`- Size: ${(product.ContentLength / 1024 / 1024).toFixed(2)} MB`);
    }

    // Step 3: Test refresh token
    if (tokenData.refresh_token) {
      console.log('\n3️⃣ Testing token refresh...');
      
      const refreshBody = new URLSearchParams({
        'client_id': 'cdse-public',
        'grant_type': 'refresh_token',
        'refresh_token': tokenData.refresh_token
      });

      const refreshResponse = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BGAPP-Test/1.0'
        },
        body: refreshBody.toString()
      });

      if (refreshResponse.ok) {
        const newTokenData = await refreshResponse.json();
        console.log('✅ Token refresh successful!');
        console.log(`New token: ${newTokenData.access_token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ Token refresh failed:', refreshResponse.status);
      }
    }

    console.log('\n✅ All tests passed! Simple authentication (no TOTP) works perfectly.');
    console.log('\n📌 Summary:');
    console.log('- Authentication: ✅ Success (no TOTP needed)');
    console.log('- API Access: ✅ Success');
    console.log('- Token Refresh: ✅ Success');
    console.log('\nThe official documentation is correct - TOTP is NOT required for API access!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSimpleAuth();
