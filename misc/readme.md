# The settings file

The settings file is used by the image server. The settings are as follows:

1. `user_quota_kilobytes` - Sets the user file quota in bytes. User file sizes are tracked in the database. Default value is `16384`. Setting can (should) be bypassed by service accounts.

2. `preffered_format` - Sets the preffered format for saving pictures. Default value is `auto`. Options are:
    * `png` - images will be resized to the maximum size allowed if larger.
    * `jpeg` - as well as resizing the image if needed, images will also be jpeg compressed.
    * `auto` - this option will compare the two and choose the one that is a smaller size. This option is slowest as the picture has to be converted to both formats before determining which one is smaller
    * `preserve` - this option will preserve the original file format, but still making changes.
    * `original` - this option will perform no modifications to the picture on save.

3. `quality` - Sets the image quality to be used when saving pictures onto the server. Option is ignored when `preffered_format` is `original`. Default value is `0.95`.

4. `max_file_size_kilobytes` - Sets the maximum file size after compression and resizing. If the file is still larger than that after, the server will return an error. Default is `4096`.

5. `max_resolution` - Sets the maximum allowed resolution for images to be stored on the server. The server exprects two a string with two numbers in the `NNNNxNNNN` format. Default value is `500x500` 

6. `check_jwt`: Whether requests should be checked for a jwt cookie. Default is `true`. Setting this option to `false` will cause the server to ignore options 7 to 9.

7. `use_local_public_cert` - Use a local certificate instead of fetching it from JWT issuer at startup. Default value is `true`.

8. `public_cert_location` - The file path or url at which the public cert for JWT tokens can be acquired. Get requests with no parameters are used for reading the public certificate from a webserver.

9. `jwt_cookie_name` - The name of the JWT cookie in the incoming request that the server should look for. Default value `jwt_token`.
