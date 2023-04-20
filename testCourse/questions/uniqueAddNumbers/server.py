import random


def generate(data):
    # assuming variant_keys is given
    # data['variant_keys'] = random.randint(0, 35)
    
    # Sample two random integers between 5 and 10 (inclusive)
    # var_key = data['variant_keys'] % 36
    var_key = random.randint(0, 35)
    lst = [(i, j) for i in range(5, 11) for j in range(5, 11)]
    a, b = lst[var_key]

    # Put these two integers into data['params']
    data["params"]["a"] = a
    data["params"]["b"] = b

    # Compute the sum of these two integers
    c = a + b

    # Put the sum into data['correct_answers']
    data["correct_answers"]["c"] = c
