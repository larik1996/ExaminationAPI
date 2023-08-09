describe('API Tests', () => {
    let bearerToken;
    let generatedEmail;
    let generatedPassword;

    before(() => {
        generatedEmail = `test${Cypress._.random(1000, 9999)}@example.com`;
        generatedPassword = Cypress._.random(100000, 999999).toString();

        const newUser = {
            email: generatedEmail,
            password: generatedPassword
        };

        cy.request('POST', 'http://localhost:3000/register', newUser).then((response) => {
            expect(response.status).to.equal(201);

            const loginData = {
                email: generatedEmail,
                password: generatedPassword
            };

            cy.request('POST', 'http://localhost:3000/login', loginData).then((loginResponse) => {
                expect(loginResponse.status).to.equal(200);
                expect(loginResponse.body).to.have.property('accessToken');
                bearerToken = loginResponse.body.accessToken;
            });
        });
    });

    beforeEach(() => {
        cy.visit('http://localhost:3000');
    });

    it('1.Get all posts. Verify HTTP response status code and content type', () => {
        cy.request('/posts').then((response) => {
            expect(response.status).to.equal(200);
            expect(response.headers['content-type']).to.include('application/json');
        });
    });

    it('2.Get only first 10 posts. Verify HTTP response status code. Verify that only first posts are returned.', () => {
        cy.request('/posts?_limit=10').then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body).to.have.lengthOf.at.most(10);
        });
    });

    it('3.Get posts with id = 55 and id = 60. Verify HTTP response status code. Verify id values of returned records.', () => {
        cy.request('/posts?id=55&id=60').then((response) => {
            expect(response.status).to.equal(200);
            const idValues = response.body.map(post => post.id);
            expect(idValues).to.deep.include(55);
            expect(idValues).to.deep.include(60);
        });
    });

    it('4.Create a post. Verify HTTP response status code', () => {
        const newPost = {
            title: `New Post Title ${Cypress._.random(1000, 9999)}`,
            body: `New Post Body ${Cypress._.random(1000, 9999)}`,
            userId: Cypress._.random(1, 10)
        };

        cy.request({
            method: 'POST',
            url: '/664/posts',
            body: newPost,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(401);
        });
    });

    it('5.Create post with adding access token in header. Verify HTTP response status code. Verify post is created.', () => {
        const newPost = {
            title: `New Post Title ${Cypress._.random(1000, 9999)}`,
            body: `New Post Body ${Cypress._.random(1000, 9999)}`,
            userId: Cypress._.random(1, 10)
        };

        cy.request({
            method: 'POST',
            url: '/664/posts',
            body: newPost,
            headers: {
                Authorization: 'Bearer ' + bearerToken
            }
        }).then((response) => {
            expect(response.status).to.equal(201);
            expect(response.body).to.deep.equal({ ...newPost, id: response.body.id });
        });
    });

    it('6. Create post entity and verify that the entity is created. Verify HTTP response status code. Use JSON in body.', () => {
        const newPost = {
            title: `New Post Title ${Cypress._.random(1000, 9999)}`,
            body: `New Post Body ${Cypress._.random(1000, 9999)}`,
            userId: Cypress._.random(1, 10)
        };

        cy.request('POST', '/posts', newPost).then((response) => {
            expect(response.status).to.equal(201);
            expect(response.body).to.deep.equal({ ...newPost, id: response.body.id });
        });
    });

    it('7. Update non-existing entity. Verify HTTP response status code', () => {
        const updateData = {
            title: 'Updated Title'
        };

        cy.request({
            method: 'PUT',
            url: '/posts/9999999999',
            body: updateData,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('8. Create post entity and update the created entity. Verify HTTP response status code and verify that the entity is updated.', () => {
        const newPost = {
            title: `New Post Title ${Cypress._.random(1000, 9999)}`,
            body: `New Post Body ${Cypress._.random(1000, 9999)}`,
            userId: Cypress._.random(1, 10)
        };

        cy.request('POST', '/posts', newPost).then((response) => {
            expect(response.status).to.equal(201);

            const updatedData = {
                title: 'Updated Title'
            };

            cy.request({
                method: 'PUT',
                url: `/posts/${response.body.id}`,
                body: updatedData
            }).then((updateResponse) => {
                expect(updateResponse.status).to.equal(200);

                cy.request(`/posts/${response.body.id}`).then((getResponse) => {
                    expect(getResponse.body.title).to.equal(updatedData.title);
                });
            });
        });
    });

    it('9. Delete non-existing post entity. Verify HTTP response status code.', () => {
        cy.request({
            method: 'DELETE',
            url: '/posts/NON_EXISTING_ID',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.equal(404);
        });
    });

    it('10. Create post entity, update the created entity, and delete the entity. Verify HTTP response status code and verify that the entity is deleted.', () => {
        const newPost = {
            title: `New Post Title ${Cypress._.random(1000, 9999)}`,
            body: `New Post Body ${Cypress._.random(1000, 9999)}`,
            userId: Cypress._.random(1, 10)
        };

        let postId;

        cy.request('POST', '/posts', newPost).then((response) => {
            expect(response.status).to.equal(201);
            postId = response.body.id;

            const updatedData = {
                title: 'Updated Title'
            };

            cy.request('PUT', `/posts/${postId}`, updatedData).then((updateResponse) => {
                expect(updateResponse.status).to.equal(200);

                cy.request('DELETE', `/posts/${postId}`).then((deleteResponse) => {
                    expect(deleteResponse.status).to.equal(200);

                    // Check if the entity is deleted
                    cy.request({
                        url: `/posts/${postId}`,
                        failOnStatusCode: false
                    }).then((getResponse) => {
                        expect(getResponse.status).to.equal(404);
                    });
                });
            });
        });
    });
});
