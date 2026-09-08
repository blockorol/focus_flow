package main

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"

	"golang.org/x/crypto/argon2"
)

const memoryKiB, iterations, parallelism, keyLength = 64 * 1024, 3, 2, 32

func hashPassword(input io.Reader, output io.Writer) error {
	password, err := io.ReadAll(io.LimitReader(input, 4099))
	if err != nil {
		return errors.New("could not read password from stdin")
	}
	password = bytes.TrimSuffix(password, []byte("\n"))
	password = bytes.TrimSuffix(password, []byte("\r"))
	if len(password) == 0 || len(password) > 4096 {
		return errors.New("password must contain between 1 and 4096 bytes")
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return errors.New("could not generate a password salt")
	}
	key := argon2.IDKey(password, salt, iterations, memoryKiB, parallelism, keyLength)
	_, err = fmt.Fprintf(output, "$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s\n", memoryKiB, iterations, parallelism, base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(key))
	return err
}

func main() {
	if len(os.Args) != 1 {
		fmt.Fprintln(os.Stderr, "Read the password from stdin; command-line arguments are not accepted.")
		os.Exit(1)
	}
	if err := hashPassword(os.Stdin, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
