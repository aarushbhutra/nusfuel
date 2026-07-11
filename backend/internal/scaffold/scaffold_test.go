package scaffold

import "testing"

func TestName(t *testing.T) {
	if Name != "NUSFuel backend" {
		t.Fatalf("unexpected backend name: %q", Name)
	}
}
