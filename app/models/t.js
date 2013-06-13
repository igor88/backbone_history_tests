// Define the module.
define(
    [
        /* No dependencies. */
    ],
    function(){


        // I provide functionality for encoding and decoding roman
        // numerals from a base10 radix.
        function RomanNumeralEncoder(){
            // ...
        }

        // Define the class methods.
        RomanNumeralEncoder.prototype = {

            // I decode roman numerals into decimal values.
            decode: function( romanNumeralValue ){

                // Lazy conversion, just to get something working.
                switch ( romanNumeralValue ){
                    case "I": return( 1 );
                    case "II": return( 2 );
                    case "III": return( 3 );
                    case "IV": return( 4 );
                    case "V": return( 5 );
                    case "VI": return( 6 );
                    case "VII": return( 7 );
                    case "VIII": return( 8 );
                    case "IX": return( 9 );
                    case "X": return( 10 );
                }

                // If nothing matched, we don't currently support a
                // convertion for this value.
                return( null );

            },


            // I encode decimal values as roman numerals.
            encode: function( decimalValue ){

                // Lazy conversion, just to get something working.
                switch ( decimalValue ){
                    case 1: return( "I" );
                    case 2: return( "II" );
                    case 3: return( "III" );
                    case 4: return( "IV" );
                    case 5: return( "V" );
                    case 6: return( "VI" );
                    case 7: return( "VII" );
                    case 8: return( "VIII" );
                    case 9: return( "IX" );
                    case 10: return( "X" );
                }

                // If nothing matched, we don't currently support a
                // convertion for this value.
                return( null );

            }

        };


        // -------------------------------------------------- //
        // -------------------------------------------------- //


        // Return the module constructor.
        return( RomanNumeralEncoder );


    }
);

