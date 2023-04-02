CREATE FUNCTION
    variants_debug(
        OUT variant json
    )
AS $$

BEGIN

SELECT INTO variant * FROM variants;

END;
$$ LANGUAGE plpgsql VOLATILE;