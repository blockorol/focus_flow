package main

import (
	"bytes"
	"encoding/base64"
	"strings"
	"testing"

	"golang.org/x/crypto/argon2"
)

func TestHashPassword(t *testing.T) {
	var previous string
	for _, suffix := range []string{"", "\n", "\r\n"} {
		var output bytes.Buffer
		if err := hashPassword(strings.NewReader(" sample password "+suffix), &output); err != nil {
			t.Fatal(err)
		}
		parts := strings.Split(strings.TrimSpace(output.String()), "$")
		if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" || parts[3] != "m=65536,t=3,p=2" {
			t.Fatal("unexpected hash encoding")
		}
		salt, err := base64.RawStdEncoding.DecodeString(parts[4])
		if err != nil || len(salt) != 16 {
			t.Fatal("invalid salt")
		}
		key, err := base64.RawStdEncoding.DecodeString(parts[5])
		if err != nil {
			t.Fatal(err)
		}
		want := argon2.IDKey([]byte(" sample password "), salt, iterations, memoryKiB, parallelism, keyLength)
		if !bytes.Equal(key, want) {
			t.Fatal("hash does not verify with the original password")
		}
		if parts[4] == previous {
			t.Fatal("salt was reused")
		}
		previous = parts[4]
	}
}

func TestInvalidInput(t *testing.T) {
	for _, value := range []string{"", "\n", "\r\n", strings.Repeat("x", 4097)} {
		var output bytes.Buffer
		if err := hashPassword(strings.NewReader(value), &output); err == nil || output.Len() != 0 {
			t.Fatal("invalid input accepted")
		}
	}
}
