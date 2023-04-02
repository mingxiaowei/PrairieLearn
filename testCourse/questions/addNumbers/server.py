import random

total_variant = [(a, b) for a in range(5, 11) for b in range(5, 11)]

def generate(data, key=None):
    # Sample two random integers between 5 and 10 (inclusive)
    if key == None:
        a = random.randint(5, 10)
        b = random.randint(5, 10)
    else:
        a, b = total_variant[key % len(total_variant)]

    # Put these two integers into data['params']
    data["params"]["a"] = a
    data["params"]["b"] = b

    # Compute the sum of these two integers
    c = a + b

    # Put the sum into data['correct_answers']
    data["correct_answers"]["c"] = c
