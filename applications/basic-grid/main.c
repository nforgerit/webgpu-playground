#include <emscripten.h>
#include <stdio.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Calculates the factorial of a non-negative integer n.
EMSCRIPTEN_KEEPALIVE
uint64_t factorial(unsigned int n) {
    uint64_t result = 1;
    for (unsigned int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

#ifdef __cplusplus
}
#endif


int main(int argc, char** argv) {
    printf("Hello World\n");
    printf("1 + 1 = %d\n", 1+1);

    return 0;
}

