package postgres

import (
	"reflect"
	"testing"
)

func TestPostgresRowsExposeDBTags(t *testing.T) {
	for _, rowType := range []reflect.Type{
		reflect.TypeOf(focusObjectRow{}),
		reflect.TypeOf(focusGoalRow{}),
		reflect.TypeOf(focusGoalLinkRow{}),
		reflect.TypeOf(focusSpecificationRow{}),
		reflect.TypeOf(focusEventRow{}),
	} {
		for i := 0; i < rowType.NumField(); i++ {
			field := rowType.Field(i)
			if field.Tag.Get("db") == "" {
				t.Fatalf("%s.%s must declare a db tag", rowType.Name(), field.Name)
			}
		}
	}
}
